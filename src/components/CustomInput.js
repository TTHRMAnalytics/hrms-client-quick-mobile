// src/components/CustomInput.js

import React from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius } from "../constants/theme";

export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  leftElement, //  icon on left
  rightElement, //  icon on right
}) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputRow}>
        {/* Left icon (e.g., mail icon) */}
        {leftElement ? (
          <View style={styles.leftElement}>
            {leftElement}
          </View>
        ) : null}

        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />

        {/* Right icon (e.g., eye toggle) */}
        {rightElement ? (
          <View style={styles.rightElement}>
            {rightElement}
          </View>
        ) : null}
      </View>

      {/* Underline */}
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftElement: {
    paddingRight: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  rightElement: {
    paddingLeft: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  underline: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
});
