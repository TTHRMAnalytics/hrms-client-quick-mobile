// src/screens/AttendanceScreen.js

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
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing } from "../constants/theme";
import { addFaceData } from "../services/api";
import { getSessionData } from "../services/baseHelper";
import useHardwareBack from "../hooks/useHardwareBack";
import useInternetStatus from "../hooks/useInternetStatus";
import NoInternetModal from "../components/NoInternetModal";
import LocationDisabledModal from "../components/LocationDisabledModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import {
  getCurrentLocation,
  hasLocationPermission,
  requestLocationPermission,
  checkLocationEnabled,
} from "../utils/locationHelper";

export default function AttendanceScreen({ navigation, route }) {
  useHardwareBack(navigation);

  const workspace = route?.params?.workspace || "";
  const isInternetAvailable = useInternetStatus();

  const [employeeId, setEmployeeId] = useState(null);
  const [attendanceKey, setAttendanceKey] = useState(null);

  // UI-only state (time + date)
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);
  const [lastActionType, setLastActionType] = useState(null); // "Check In" or "Check Out"

  /* ---------------- HELPERS ---------------- */

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
    return new Date(now.getTime() - offset * 60000)
      .toISOString()
      .slice(0, -1);
  };

  const buildAttendanceKey = (empId, workspace) =>
    `@attendance_state_${empId}_${workspace}`;

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    init();
    requestLocationPermission();
  }, []);

  const init = async () => {
    const empId =
      (await getSessionData({ key: "employee_id" })) ||
      (await getSessionData({ key: "emp_id" }));

    if (!empId) {
      Alert.alert("Error", "User not found. Please login again.");
      navigation.goBack();
      return;
    }

    setEmployeeId(empId);

    const key = buildAttendanceKey(empId, workspace);
    setAttendanceKey(key);

    const saved = await AsyncStorage.getItem(key);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (parsed.checkIn) setCheckInTime(parsed.checkIn);
    if (parsed.checkOut) setCheckOutTime(parsed.checkOut);
  };

  const saveAttendance = async (checkIn, checkOut) => {
    if (!attendanceKey) return;
    await AsyncStorage.setItem(
      attendanceKey,
      JSON.stringify({ checkIn, checkOut })
    );
  };

  /* ---------------- LOCATION ---------------- */

  const getGPSLocation = async () => {
    try {
      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        setShowLocationModal(true);
        return null;
      }

      const enabled = await checkLocationEnabled();
      if (!enabled) {
        setShowLocationModal(true);
        return null;
      }

      const loc = await getCurrentLocation();
      return `${loc.latitude},${loc.longitude}`;
    } catch (e) {
      Alert.alert(
        "Location Error",
        "Unable to get your location. Please check GPS and try again."
      );
      return null;
    }
  };


  /* ---------------- API ---------------- */

  const sendAttendance = async (type) => {
    try {
      if (!isInternetAvailable) {
        setShowNoInternetModal(true);
        return null;
      }

      setLoading(true);

      const gps = await getGPSLocation();

      if (!gps) {
        Alert.alert(
          "Location Required",
          "Cannot mark attendance without location."
        );
        return null;
      }

      const domain =
        (await getSessionData({ key: "domain_name" })) || workspace;

      if (!domain) {
        Alert.alert(
          "Workspace Error",
          "Workspace not found. Please login again."
        );
        return null;
      }


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

      if (
        e.message !== "LOCATION_PERMISSION_DENIED" &&
        e.message !== "LOCATION_SERVICES_DISABLED" &&
        e.message !== "GPS_FETCH_FAILED"
      ) {
        Alert.alert("Error", e.message || "Attendance failed");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HANDLERS ---------------- */

  const handleCheckIn = async () => {
    setLastActionType("Check In");
    const iso = await sendAttendance("Check In");
    if (!iso) return;
    const display = buildDisplayDateTime(iso);
    setCheckInTime(display);
    setShowCheckInModal(true);
    await saveAttendance(display, checkOutTime);
  };

  const handleCheckOut = async () => {
    setLastActionType("Check Out");
    const iso = await sendAttendance("Check Out");
    if (!iso) return;
    const display = buildDisplayDateTime(iso);
    setCheckOutTime(display);
    setShowCheckOutModal(true);
    await saveAttendance(checkInTime, display);
  };

  const retryLastAction = async () => {
    if (!lastActionType) {
      setShowNetworkErrorModal(false);
      return;
    }
    setShowNetworkErrorModal(false);
    await sendAttendance(lastActionType);
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.root}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Recording attendance…</Text>
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

      {/* Main Card */}
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
            style={styles.checkInButton}
            onPress={handleCheckIn}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInText}>CHECK IN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
            activeOpacity={0.8}
          >
            <Text style={styles.checkOutText}>CHECK OUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Disabled Modal */}
      <LocationDisabledModal
        visible={showLocationModal}
        onCancel={() => setShowLocationModal(false)}
      />

      {/* No Internet Modal (pure offline, before request) */}
      <NoInternetModal
        visible={showNoInternetModal}
        onRetry={() => {
          setShowNoInternetModal(false);
        }}
      />

      {/* Network Error Modal (fetch failed) */}
      <NetworkErrorModal
        visible={showNetworkErrorModal}
        onRetry={retryLastAction}
        onGoHome={() => {
          setShowNetworkErrorModal(false);
          navigation.navigate("Home");
        }}
      />

      {/* Check In Modal */}
      <Modal
        visible={showCheckInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCheckInModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check In Confirmed!</Text>
            <Text style={styles.modalMessage}>
              You have successfully checked in at {checkInTime?.time}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCheckInModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Check Out Modal */}
      <Modal
        visible={showCheckOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCheckOutModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowCheckOutModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Icon name="checkmark-circle" size={60} color={colors.accent} />
            <Text style={styles.modalTitle}>Check Out Confirmed!</Text>
            <Text style={styles.modalMessage}>
              You have successfully checked out at {checkOutTime?.time}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCheckOutModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: { color: "#fff", marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
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
  timeContainer: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: spacing.md,
    borderRadius: 16,
    gap: spacing.md,
  },
  timeInfo: { flex: 1 },
  timeLabel: { color: "#888", fontSize: 12 },
  timeValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  timeDate: { color: "#aaa", fontSize: 12 },
  buttonsContainer: {
    width: "100%",
    marginTop: "auto",
    gap: spacing.md,
  },
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
    marginBottom: spacing.sm,
  },
  modalMessage: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  modalButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
  },
  modalButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
});
