// src/screens/ForgotPasswordConfirmationScreen.js
import React from "react";
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
import CustomButton from "../components/CustomButton";
import useHardwareBack from "../hooks/useHardwareBack";

export default function ForgotPasswordConfirmationScreen({ navigation, route }) {
  useHardwareBack(navigation);

  const email = route?.params?.email || "";

  const handleBackToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.headerLogo}
        />
        <Text style={styles.appName}>MEEPL</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Email Icon */}
        <View style={styles.iconContainer}>
          <Icon name="mail" size={50} color={colors.accent} />
        </View>

        <Text style={styles.cardTitle}>Please check your email!</Text>

        <Text style={styles.cardMessage}>
          We have sent a link to your email ID{" "}
          <Text style={styles.emailText}>{email}</Text>, please open your email
          and follow the procedure to set your password.
        </Text>

        {/* Back to Login Button */}
        <CustomButton
          label="Back To Login"
          onPress={handleBackToLogin}
          style={styles.primaryButton}
        />
      </View>
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
  card: {
    width: "88%",
    backgroundColor: "#111",
    padding: spacing.xl,
    borderRadius: 28,
    elevation: 12,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1b1b1b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  cardMessage: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emailText: {
    color: colors.accent,
    fontWeight: "600",
  },
  primaryButton: {
    width: "100%",
  },
});
