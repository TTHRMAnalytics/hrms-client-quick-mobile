import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import { addFaceData, getEmployeeLastAttendanceStatus } from "../services/api";
import { getSessionData } from "../services/baseHelper";
import useHardwareBack from "../hooks/useHardwareBack";
import useInternetStatus from "../hooks/useInternetStatus";
import NoInternetModal from "../components/NoInternetModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import { getCachedLocation, triggerBackgroundRefresh } from "../utils/locationManager";
import { InlineLoader } from "../components/LoadingOverlay";

export default function AttendanceScreen({ navigation, route }) {
  useHardwareBack(navigation);

  const workspace = route?.params?.workspace || "";
  const isInternetAvailable = useInternetStatus();

  // ---------------- STATE ----------------
  const [employeeId, setEmployeeId] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);
  const [lastActionType, setLastActionType] = useState(null);

  // ---------------- INIT ----------------
  useEffect(() => {
    initEmployee();
  }, []);

  useEffect(() => {
    if (employeeId) {
      loadLastAttendanceStatus();
    }
  }, [employeeId]);

  const initEmployee = async () => {
    const empId =
      (await getSessionData({ key: "employee_id" })) ||
      (await getSessionData({ key: "emp_id" }));

    if (!empId) {
      Alert.alert("Error", "User not found. Please login again.");
      navigation.goBack();
      return;
    }

    setEmployeeId(empId);
  };

  // ---------------- HELPERS ----------------
  const buildDisplayDateTime = (iso) => {
    const d = new Date(iso);
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
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, -1);
  };

  // ---------------- SERVER STATUS ----------------
  const loadLastAttendanceStatus = async () => {
    try {
      const domain =
        (await getSessionData({ key: "domain_name" })) || workspace;

      const res = await getEmployeeLastAttendanceStatus({
        employeeId,
        domainName: domain,
      });

      const status = res?.data || res;
      setServerStatus(status);

      if (status?.last_action === "Check In" && status?.check_in_time) {
        setCheckInTime(buildDisplayDateTime(status.check_in_time));
        setCheckOutTime(null);
      }

      if (status?.last_action === "Check Out" && status?.check_out_time) {
        setCheckOutTime(buildDisplayDateTime(status.check_out_time));
      }
    } catch (e) {
      // quiet fail, optional log
    }
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
          "Unable to get location",
          "Please ensure location is enabled and try again."
        );
        return null;
      }

      const gps = `${cached.latitude},${cached.longitude}`;
      const domain =
        (await getSessionData({ key: "domain_name" })) || workspace;
      const recordTime = getLocalISOTime();

      const res = await addFaceData({
        employeeId,
        recordTime,
        entryType: type,
        domainName: domain,
        userId: employeeId,
        liveLocation: gps,
      });

      return res?.data?.record_time || res?.record_time || recordTime;
    } catch (e) {
      if (e.message === "Network request failed") {
        setShowNetworkErrorModal(true);
        return null;
      }

      Alert.alert("Error", e.message || "Attendance failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- HANDLERS ----------------
  const handleCheckIn = async () => {
    setLastActionType("Check In");
    const iso = await sendAttendance("Check In");
    if (!iso) return;

    setCheckInTime(buildDisplayDateTime(iso));
    setCheckOutTime(null);
    setShowCheckInModal(true);
    setServerStatus({ last_action: "Check In" });
  };

  const handleCheckOut = async () => {
    setLastActionType("Check Out");
    const iso = await sendAttendance("Check Out");
    if (!iso) return;

    setCheckOutTime(buildDisplayDateTime(iso));
    setShowCheckOutModal(true);
    setServerStatus({ last_action: "Check Out" });
  };

  const retryLastAction = async () => {
    if (!lastActionType) {
      setShowNetworkErrorModal(false);
      return;
    }
    setShowNetworkErrorModal(false);
    await sendAttendance(lastActionType);
  };

  // ---------------- BUTTON STATES (SERVER ONLY) ----------------
  const lastAction = serverStatus?.last_action;
  const isCheckInDisabled = lastAction === "Check In";
  const isCheckOutDisabled = lastAction !== "Check In";

  // ---------------- UI ----------------
  return (
    <SafeAreaView style={styles.root}>
      {/* Centered loader over entire screen */}
      {loading && (
        <View style={styles.centerLoader}>
          <InlineLoader visible={true} size={40} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main card */}
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
            style={[
              styles.checkOutButton,
              isCheckOutDisabled && { opacity: 0.4 },
            ]}
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

      {/* Check In Modal */}
      <Modal visible={showCheckInModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCheckInModal(false)}
        >
          <Pressable style={styles.modalCard}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check In Confirmed!</Text>
            <Text style={styles.modalMessage}>
              You checked in at {checkInTime?.time}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Check Out Modal */}
      <Modal visible={showCheckOutModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCheckOutModal(false)}
        >
          <Pressable style={styles.modalCard}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check Out Confirmed!</Text>
            <Text style={styles.modalMessage}>
              You checked out at {checkOutTime?.time}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.lg,
  },
  centerLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
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
  timeContainer: { width: "100%", gap: spacing.md },
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
