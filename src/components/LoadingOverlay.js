// src/components/LoadingOverlay.js

import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View, Modal } from "react-native";

/**
 * Internal hook to create a spinning animated value
 */
function useSpin(visible) {
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
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return spin;
}

/**
 * 1) Full-screen overlay (existing behavior)
 */
export default function LoadingOverlay({ visible }) {
  if (!visible) return null;

  const spin = useSpin(visible);

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

/**
 * 2) Logo-only spinner (no background) for headers, inline use
 */
export function InlineLoader({ visible, size = 32 }) {
  if (!visible) return null;

  const spin = useSpin(visible);

  return (
    <Animated.Image
      source={require("../assets/logo.png")}
      style={{ width: size, height: size, transform: [{ rotate: spin }] }}
      resizeMode="contain"
    />
  );
}

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
