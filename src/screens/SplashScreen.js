// src/screens/SplashScreen.js

import React, { useEffect } from "react";
import { View, Image, Text, StyleSheet, StatusBar } from "react-native";
import { getSessionData } from "../services/baseHelper";
import MeeplLogo from "../components/MeeplLogo";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const run = async () => {
      try {
        // Run storage read and splash delay in parallel
        const [savedEmail] = await Promise.all([
          getSessionData({ key: "saved_email" }),
          new Promise((resolve) => setTimeout(resolve, 2000)), // 2s splash
        ]);

        if (savedEmail) {
          navigation.replace("Welcome");
        } else {
          navigation.replace("Email");
        }
      } catch (e) {
        navigation.replace("Email");
      }
    };

    run();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <MeeplLogo width={80} height={80} />
      <Text style={styles.appName}>MEEPL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // Pure black background
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 3,
  },
});
