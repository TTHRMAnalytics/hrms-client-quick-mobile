// src/components/CustomToast.js
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const DURATION = 5000;

export default function CustomToast({ visible, message, type = "error", onHide }) {
  const progress = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && message) {
      // reset
      progress.setValue(1);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: DURATION,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished && onHide) {
          onHide();
        }
      });
    }
  }, [visible, message, onHide, opacity, progress]);

  if (!visible || !message) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const isError = type === "error";
  const bg = isError ? "#2b0000" : "#002b1a";
  const accent = isError ? "#ff4242" : "#00ff9f";

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <View style={[styles.container, { backgroundColor: bg, borderLeftColor: accent }]}>
        <Text style={styles.title}>{isError ? "Error" : "Info"}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { backgroundColor: accent, width: barWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 50,
  },
  container: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 2,
    fontSize: 14,
  },
  message: {
    color: "#f5f5f5",
    fontSize: 13,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#444",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
});
