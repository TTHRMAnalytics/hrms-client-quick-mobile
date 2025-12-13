// src/components/LoadingSpinner.js
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

export default function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
