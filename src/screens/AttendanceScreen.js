import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  BackHandler,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { getUserErrorMessage, handleCriticalError } from "../utils/errorHandler";
import { colors, spacing } from "../constants/theme";
import { addFaceData, getEmployeeLastAttendanceStatus, getFaceData } from "../services/api";
import {
  getSessionData,
  saveAttendanceState,
  getAttendanceState
} from "../services/baseHelper";
import NoInternetModal from "../components/NoInternetModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import { InlineLoader } from "../components/LoadingOverlay";
import {
  getCachedLocation,
  triggerBackgroundRefresh,
} from "../utils/locationManager";
import NetInfo from "@react-native-community/netinfo";

export default function AttendanceScreen({ navigation, route }) {
  // State hooks
  const [employeeId, setEmployeeId] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);
  const [lastActionType, setLastActionType] = useState(null);
  const [isInternetAvailable, setIsInternetAvailable] = useState(true);

  // Ref hooks
  const hasInitialized = useRef(false);

  // Internet status effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsInternetAvailable(connected);
    });
    return () => unsubscribe();
  }, []);

  // Back button handler effect
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, []);

  // Init effect (runs only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initScreen();
    }
    return () => {
      hasInitialized.current = false;
    };
  }, []);

  const workspace = route?.params?.workspace || "";

  // ---------------- INIT ----------------
  const initScreen = async () => {
    try {
      setInitialLoading(true);
      const empId =
        (await getSessionData({ key: "employee_id" })) ||
        (await getSessionData({ key: "emp_id" }));

      if (!empId) {
        Alert.alert("Session Error", "Please login again to continue.");
        navigation.goBack();
        return;
      }

      setEmployeeId(empId);
      
      const cached = await getAttendanceState({ employeeId: empId });
      if (cached && cached.last_action) {
        setLastAction(cached.last_action);
        if (cached.check_in_time) {
          setCheckInTime(buildDisplayDateTime(cached.check_in_time));
        }
        if (cached.check_out_time) {
          setCheckOutTime(buildDisplayDateTime(cached.check_out_time));
        }
      }
      
      await syncWithServer(empId);
    } catch (e) {
      Alert.alert("Error", "Unable to load attendance data. Please try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  // ---------------- SERVER SYNC ----------------
  const syncWithServer = async (empId) => {
    try {
      const domain =
        (await getSessionData({ key: "domain_name" })) || workspace;

      let res;
      let useFallback = false;

      try {
        const today = new Date().toISOString().split('T')[0];
        res = await getFaceData({
          fromDate: today,
          toDate: today,
          empId: empId,
          domainName: domain,
        });

        if (res?.statuscode === "500" || res?.status === "failed") {
          useFallback = true;
        }
      } catch (e) {
        useFallback = true;
      }

      if (useFallback) {
        res = await getEmployeeLastAttendanceStatus({
          employeeId: empId,
          domainName: domain,
        });
      }

      // Parse response based on which API was used
      let serverLastAction = null;
      let serverCheckInTime = null;
      let serverCheckOutTime = null;

      if (useFallback) {
        const statusArray = res?.data;
        const status = Array.isArray(statusArray) ? statusArray[0] : statusArray;

        serverLastAction =
          status?.record_type ||
          status?.fn_get_last_attendance_status ||
          status?.last_action ||
          null;

        const serverTimestamp = status?.record_timestamp || null;

        if (serverLastAction === "Check In" && serverTimestamp) {
          serverCheckInTime = serverTimestamp;
          serverCheckOutTime = null;
        } else if (serverLastAction === "Check Out" && serverTimestamp) {
          serverCheckOutTime = serverTimestamp;
        }
      } else {
        const attendanceData = res?.data || [];
        const latestRecord = Array.isArray(attendanceData) && attendanceData.length > 0
          ? attendanceData[attendanceData.length - 1]
          : null;

        if (latestRecord) {
          serverCheckInTime =
            latestRecord.check_in_time ||
            latestRecord.checkInTime ||
            latestRecord.record_time ||
            null;
          serverCheckOutTime =
            latestRecord.check_out_time ||
            latestRecord.checkOutTime ||
            null;

          if (serverCheckOutTime) {
            serverLastAction = "Check Out";
          } else if (serverCheckInTime) {
            serverLastAction = "Check In";
          }
        }
      }

      const existingCache = await getAttendanceState({ employeeId: empId });

      let finalCheckInTime = serverCheckInTime || existingCache?.check_in_time || null;
      let finalCheckOutTime = serverCheckOutTime || existingCache?.check_out_time || null;

      setLastAction(serverLastAction);

      if (serverLastAction === "Check In") {
        if (finalCheckInTime) {
          const displayTime = buildDisplayDateTime(finalCheckInTime);
          setCheckInTime(displayTime);
        }
        setCheckOutTime(null);
        finalCheckOutTime = null;
      } else if (serverLastAction === "Check Out") {
        if (finalCheckOutTime) {
          const displayTime = buildDisplayDateTime(finalCheckOutTime);
          setCheckOutTime(displayTime);
        }
        if (finalCheckInTime) {
          const displayTime = buildDisplayDateTime(finalCheckInTime);
          setCheckInTime(displayTime);
        }
      } else {
        if (!existingCache?.last_action) {
          setCheckInTime(null);
          setCheckOutTime(null);
          finalCheckInTime = null;
          finalCheckOutTime = null;
        }
      }

      await saveAttendanceState({
        employeeId: empId,
        lastAction: serverLastAction,
        checkInTime: finalCheckInTime,
        checkOutTime: finalCheckOutTime,
      });
    } catch (e) {
      // Silent fail - cache will be used
    }
  };

  // ---------------- HELPERS ----------------
  const buildDisplayDateTime = (iso) => {
    const cleanIso = iso?.replace('Z', '');
    const d = new Date(cleanIso);
    return {
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  };

  const getLocalISOTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
      .toISOString()
      .slice(0, -1);
  };

  // ---------------- LOCATION ----------------
  const waitForLocation = async (maxRetries = 6, delayMs = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      const cached = await getCachedLocation();
      if (cached) return cached;
      triggerBackgroundRefresh();
      await new Promise((res) => setTimeout(res, delayMs));
    }
    return null;
  };

  // ---------------- API ----------------
  const sendAttendance = async (type) => {
    try {
      if (!isInternetAvailable) {
        setShowNoInternetModal(true);
        return null;
      }

      setLoading(true);
      const cached = await waitForLocation();

      if (!cached) {
        Alert.alert(
          "Location Required",
          "Unable to get your location. Please enable location services and try again."
        );
        return null;
      }

      const gps = `${cached.latitude},${cached.longitude}`;
      const domain =
        (await getSessionData({ key: "domain_name" })) || workspace;
      const recordTime = getLocalISOTime();

      const payload = {
        employeeId,
        recordTime,
        entryType: type,
        domainName: domain,
        userId: employeeId,
        liveLocation: gps,
      };

      const res = await addFaceData(payload);

      const responseData = res?.data?.[0] || res?.data || {};
      const serverCheckIn =
        responseData.last_check_in ||
        responseData.check_in_time ||
        responseData.checkInTime ||
        null;
      const serverCheckOut =
        responseData.last_check_out ||
        responseData.check_out_time ||
        responseData.checkOutTime ||
        null;
      const returnedTime = res?.data?.record_time || res?.record_time || recordTime;

      return {
        timestamp: returnedTime,
        serverCheckIn,
        serverCheckOut,
      };
    } catch (e) {
      // Handle critical errors (session expiry)
      const handled = await handleCriticalError(e, navigation);
      if (handled) return null;

      // Show user-friendly errors only
      if (e.message === "Network request failed") {
        setShowNetworkErrorModal(true);
        return null;
      }

      Alert.alert("Attendance Error", "Unable to record attendance. Please try again.");
      return null;

    } finally {
      setLoading(false);
    }
  };

  // ---------------- HANDLERS ----------------
  const handleCheckIn = async () => {
    setLastActionType("Check In");
    const result = await sendAttendance("Check In");
    if (!result) {
      return;
    }

    const iso = result.serverCheckIn || result.timestamp;
    const displayTime = buildDisplayDateTime(iso);
    setCheckInTime(displayTime);
    setCheckOutTime(null);
    setLastAction("Check In");
    await saveAttendanceState({
      employeeId,
      lastAction: "Check In",
      checkInTime: iso,
      checkOutTime: null,
    });
    setShowCheckInModal(true);
  };

  const handleCheckOut = async () => {
    setLastActionType("Check Out");
    const result = await sendAttendance("Check Out");
    if (!result) {
      return;
    }

    const checkInISO = result.serverCheckIn;
    const checkOutISO = result.serverCheckOut || result.timestamp;
    const displayTime = buildDisplayDateTime(checkOutISO);
    setCheckOutTime(displayTime);
    setLastAction("Check Out");

    if (checkInISO) {
      setCheckInTime(buildDisplayDateTime(checkInISO));
    } else {
      const existingCache = await getAttendanceState({ employeeId });
      if (existingCache?.check_in_time) {
        setCheckInTime(buildDisplayDateTime(existingCache.check_in_time));
      }
    }

    const existingCache = await getAttendanceState({ employeeId });
    const finalCheckInISO = checkInISO || existingCache?.check_in_time;

    await saveAttendanceState({
      employeeId,
      lastAction: "Check Out",
      checkInTime: finalCheckInISO,
      checkOutTime: checkOutISO,
    });
    setShowCheckOutModal(true);
  };

  const retryLastAction = async () => {
    if (!lastActionType) {
      setShowNetworkErrorModal(false);
      return;
    }

    setShowNetworkErrorModal(false);
    if (lastActionType === "Check In") {
      await handleCheckIn();
    } else {
      await handleCheckOut();
    }
  };

  // ---------------- BUTTON STATES ----------------
  const isCheckInDisabled = lastAction === "Check In";
  const isCheckOutDisabled = lastAction !== "Check In";

  // ---------------- UI ----------------
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centerLoader}>
          <InlineLoader size={45} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {loading && (
        <View style={styles.centerLoader}>
          <InlineLoader size={45} />
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Icon name="finger-print" size={80} color={colors.accent} />
        </View>

        {(checkInTime || checkOutTime) && (
          <View style={styles.timeContainer}>
            {checkInTime && (
              <View style={styles.timeCard}>
                <Icon name="enter-outline" size={28} color={colors.accent} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>{checkInTime.time}</Text>
                  <Text style={styles.timeDate}>{checkInTime.date}</Text>
                </View>
              </View>
            )}

            {checkOutTime && (
              <View style={styles.timeCard}>
                <Icon name="exit-outline" size={28} color="#ff4242" />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Check Out</Text>
                  <Text style={styles.timeValue}>{checkOutTime.time}</Text>
                  <Text style={styles.timeDate}>{checkOutTime.date}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.checkInButton, isCheckInDisabled && { opacity: 0.4 }]}
            onPress={handleCheckIn}
            disabled={isCheckInDisabled}
          >
            <Text style={styles.checkInText}>CHECK IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkOutButton, isCheckOutDisabled && { opacity: 0.4 }]}
            onPress={handleCheckOut}
            disabled={isCheckOutDisabled}
          >
            <Text style={styles.checkOutText}>CHECK OUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NoInternetModal
        visible={showNoInternetModal}
        onRetry={() => setShowNoInternetModal(false)}
      />

      <NetworkErrorModal
        visible={showNetworkErrorModal}
        onRetry={retryLastAction}
        onGoHome={() => {
          setShowNetworkErrorModal(false);
          navigation.navigate("Home");
        }}
      />

      <Modal visible={showCheckInModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCheckInModal(false)}>
          <Pressable style={styles.modalCard}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check In Confirmed!</Text>
            <Text style={styles.modalMessage}>You checked in at {checkInTime?.time}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCheckOutModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCheckOutModal(false)}>
          <Pressable style={styles.modalCard}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check Out Confirmed!</Text>
            <Text style={styles.modalMessage}>You checked out at {checkOutTime?.time}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    paddingTop: 48,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  centerLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  card: {
    flex: 1,
    margin: spacing.lg,
    backgroundColor: "#111",
    borderRadius: 28,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  timeContainer: { width: "100%", gap: spacing.md, marginBottom: spacing.lg },
  timeCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: spacing.md,
    borderRadius: 16,
    gap: spacing.md,
  },
  timeInfo: { flex: 1 },
  timeLabel: { color: "#888", fontSize: 12 },
  timeValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  timeDate: { color: "#aaa", fontSize: 12 },
  buttonsContainer: { width: "100%", marginTop: "auto", gap: spacing.md },
  checkInButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  checkOutButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#ff4242",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  checkInText: { color: "#000", fontSize: 18, fontWeight: "700" },
  checkOutText: { color: "#ff4242", fontSize: 18, fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  modalMessage: {
    color: "#aaa",
    fontSize: 15,
    marginTop: spacing.sm,
  },
});
