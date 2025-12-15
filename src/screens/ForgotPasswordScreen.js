// src/screens/ForgotPasswordScreen.js
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import CustomToast from "../components/CustomToast";
import LoadingOverlay from "../components/LoadingOverlay";
import useHardwareBack from "../hooks/useHardwareBack";

export default function ForgotPasswordScreen({ navigation }) {
  useHardwareBack(navigation);

  const [email, setEmail] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const showToast = (message, type = "error") => {
    setToast({ visible: true, message, type });
  };

  const handleSendRequest = async () => {
    const trimmedEmail = email.trim();
    const trimmedWorkspace = workspace.trim();

    if (!trimmedEmail) {
      showToast("Please enter your email address.");
      return;
    }

    if (!trimmedWorkspace) {
      showToast("Please enter your workspace.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // TODO: Add your API call here
      // await forgotPasswordAPI({ email: trimmedEmail, workspace: trimmedWorkspace });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to confirmation screen
      navigation.navigate("ForgotPasswordConfirmation", {
        email: trimmedEmail,
      });
    } catch (err) {
      console.error(err);
      const msg =
        err?.message && typeof err.message === "string"
          ? err.message
          : "Unable to send reset request. Please try again.";
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.headerLogo}
        />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Card */}
      <View style={styles.card}>
        {/* Lock Icon */}
        <View style={styles.cardIcon}>
          <Icon name="lock-closed" size={24} color={colors.accent} />
        </View>

        <Text style={styles.cardTitle}>Forgot your password?</Text>
        <Text style={styles.cardSubtitle}>
          Please enter the email address associated with your account and we
          will email you a link to reset your password.
        </Text>

        {/* Email Input */}
        <CustomInput
          label="Email *"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          leftElement={<Icon name="mail-outline" size={20} color="#888" />}
        />

        {/* Workspace Input */}
        <CustomInput
          label="WorkSpace *"
          placeholder="Enter your workspace"
          value={workspace}
          onChangeText={setWorkspace}
          leftElement={<Icon name="business-outline" size={20} color="#888" />}
        />

        {/* Send Request Button */}
        <CustomButton
          label="Send Request"
          onPress={handleSendRequest}
          style={styles.primaryButton}
        />

        {/* Cancel Link */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelLink}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

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
  headerLogo: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  appName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
  },
  backButton: {
    position: "absolute",
    left: 22,
    top: 22,
    padding: 6,
  },
  card: {
    width: "88%",
    backgroundColor: "#111",
    padding: spacing.lg,
    borderRadius: 28,
    elevation: 12,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1b1b1b",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardSubtitle: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 12,
  },
  cancelLink: {
    marginTop: spacing.md,
    color: colors.accent,
    textAlign: "center",
    fontSize: 14,
  },
});
