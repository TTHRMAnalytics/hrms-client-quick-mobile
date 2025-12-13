// src/components/NoInternetModal.js

import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";

export default function NoInternetModal({ visible, onRetry }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Icon
            name="wifi-outline"
            size={64}
            color="#ff4242"
            style={{ marginBottom: spacing.md }}
          />

          <Text style={styles.title}>No Internet Connection</Text>

          <Text style={styles.message}>
            Please check your internet connection and try again.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ff4242",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  message: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#ff4242",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
