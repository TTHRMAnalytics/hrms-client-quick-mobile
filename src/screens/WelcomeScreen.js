// src/screens/WelcomeScreen.js

import React, { useState, useEffect } from "react";
import useHardwareBack from "../hooks/useHardwareBack";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";          //  already used elsewhere in project
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing } from "../constants/theme";
import MeeplLogo from "../components/MeeplLogo";
import ConfirmSwitchAccountModal from "../components/ConfirmSwitchAccountModal";
import NoInternetModal from "../components/NoInternetModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import LocationDisabledModal from "../components/LocationDisabledModal";
import useInternetStatus from "../hooks/useInternetStatus";
import { startBackgroundLocation } from "../utils/locationManager";

import {
  getSessionData,
  removeSessionData,
  clearSessionData,
} from "../services/baseHelper";

export default function WelcomeScreen({ navigation }) {
  useHardwareBack(navigation);

  const [email, setEmail] = useState("");
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const isInternetAvailable = useInternetStatus();
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  /* ---------- load saved email ---------- */
  useEffect(() => {
    loadSavedEmail();
    precheckAndStartLocation();
  }, []);

  const precheckAndStartLocation = async () => {
    if (!isInternetAvailable) {
      setShowNoInternet(true);
      return;
    }

    const ok = await startBackgroundLocation();
    if (!ok) {
      setShowLocationModal(true);
    }
  };


  const loadSavedEmail = async () => {
    const savedEmail = await getSessionData({ key: "saved_email" });
    if (!savedEmail) {
      navigation.replace("Email");
      return;
    }
    setEmail(savedEmail);
  };

  /* ---------- actions ---------- */
  const handleContinue = () => {
    navigation.navigate("Workspace");
  };

  const confirmSwitchAccount = async () => {
    // 🔥 CLEAR ALL ATTENDANCE STATE
    const keys = await AsyncStorage.getAllKeys();
    const attendanceKeys = keys.filter((key) =>
      key.startsWith("@attendance_state_")
    );
    await AsyncStorage.multiRemove(attendanceKeys);

    // Clear session + email
    await removeSessionData({ key: "saved_email" });
    await clearSessionData();

    setShowSwitchModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Email" }],
    });
  };

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.root}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <MeeplLogo width={64} height={64} />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Signed in as</Text>

        {/* Email row with icon (no grey box) */}
        <View style={styles.emailRow}>
          <Icon
            name="mail-outline"
            size={18}
            color={colors.accent}
            style={styles.emailIcon}
          />
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowSwitchModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>Switch account</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Account Confirmation Modal */}
      <ConfirmSwitchAccountModal
        visible={showSwitchModal}
        onCancel={() => setShowSwitchModal(false)}
        onConfirm={confirmSwitchAccount}
      />
      <NoInternetModal
        visible={showNoInternet}
        onRetry={() => {
          setShowNoInternet(false);
          precheckAndStartLocation();
        }}
      />

      <NetworkErrorModal
        visible={showNetworkError}
        onRetry={() => {
          setShowNetworkError(false);
          precheckAndStartLocation();
        }}
        onGoHome={() => setShowNetworkError(false)}
      />

      <LocationDisabledModal
        visible={showLocationModal}
        onCancel={() => setShowLocationModal(false)}
      />

    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoContainer: {
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.xl,  // This adds space below
  },
  appName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },

  card: {
    width: "88%",
    backgroundColor: "#111",
    borderRadius: 28,
    padding: spacing.lg,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emailIcon: {
    marginRight: 8,
  },
  emailText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  primaryText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  switchText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 6,
  },
});
