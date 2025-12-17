// src/screens/EmailScreen.js

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import MeeplLogo from "../components/MeeplLogo";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import CustomToast from "../components/CustomToast";
import LoadingOverlay from "../components/LoadingOverlay";
import { getWorkspaces } from "../services/api";
import { addSessionData } from "../services/baseHelper";
import useHardwareBack from "../hooks/useHardwareBack";
import NoInternetModal from "../components/NoInternetModal";
import NetworkErrorModal from "../components/NetworkErrorModal";
import LocationDisabledModal from "../components/LocationDisabledModal";
import useInternetStatus from "../hooks/useInternetStatus";
import { startBackgroundLocation } from "../utils/locationManager";
import { getUserErrorMessage, isValidEmail } from "../utils/errorHandler";

export default function EmailScreen({ navigation }) {
  useHardwareBack(navigation);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isInternetAvailable = useInternetStatus();
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  useEffect(() => {
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

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
  };

  const handleContinue = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      showToast("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      await addSessionData({
        key: "saved_email",
        value: trimmed.toLowerCase(),
      });
      const workspaces = await getWorkspaces(trimmed);
      if (!workspaces || workspaces.length === 0) {
        showToast("No workspace found for this email. Please check and try again.");
        return;
      }
      navigation.navigate("Workspace", { email: trimmed, workspaces });
    } catch (err) {
      const userMessage = getUserErrorMessage(err, 'email');
      showToast(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top logo + Meepl */}
      <View style={styles.logoContainer}>
        <MeeplLogo width={64} height={64} />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Let’s get started</Text>
        <Text style={styles.cardSubtitle}>Enter your email to continue</Text>

        {/* Input with mail icon on the LEFT */}
        <CustomInput
          label="Enter your email"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          leftElement={
            <Icon name="mail-outline" size={20} color="#888" />
          }
        />

        <CustomButton
          label="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
        />

        {/* Pager dots */}
        <View style={styles.pager}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <LoadingOverlay visible={loading} />
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: "#111111",
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg + 4,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    marginTop: spacing.md,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  cardSubtitle: {
    color: "#a0a0a0",
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 12,
  },
  pager: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#444",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.accent,
  },
});
