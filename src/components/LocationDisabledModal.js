// src/components/LocationDisabledModal.js

import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors, spacing } from "../constants/theme";

export default function LocationDisabledModal({ visible, onCancel }) {
  if (!visible) return null;

  const handleOpenSettings = () => {
    if (Platform.OS === "android") {
      Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
    } else {
      Linking.openURL("app-settings:");
    }
    onCancel(); // Close modal after opening settings
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="location-outline" size={50} color="#FFC400" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Location Services Disabled</Text>

          {/* Message */}
          <Text style={styles.message}>
            Please enable location services to use this app.{"\n"}
            Attendance requires your location.
          </Text>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.settingsButton]}
              onPress={handleOpenSettings}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsText}>OPEN SETTINGS</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
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
    padding: 30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 196, 0, 0.3)",
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2a2214",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  title: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 22,
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  message: {
    color: "#aaa",
    fontSize: 15,
    marginBottom: spacing.xl,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "#444",
  },
  settingsButton: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
  },
  cancelText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  settingsText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
