// src/components/LoadingOverlay.js

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, Modal } from "react-native";

/* ---------------- FULL SCREEN LOADER ---------------- */
export default function LoadingOverlay({ visible }) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => {
      loop.stop();
      spinValue.setValue(0);
    };
  }, [visible]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.Image
          source={require("../assets/logo.png")}
          style={[styles.logo, { transform: [{ rotate: spin }] }]}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

/* ---------------- INLINE LOGO LOADER ---------------- */
export function InlineLoader({ size = 50 }) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.Image
      source={require("../assets/logo.png")}
      style={{
        width: size,
        height: size,
        transform: [{ rotate: spin }],
      }}
      resizeMode="contain"
    />
  );
}

/* ---------------- STYLES (ONLY ONCE) ---------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
});
