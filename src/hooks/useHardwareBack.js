import { useEffect } from "react";
import { BackHandler } from "react-native";

export default function useHardwareBack(navigation) {
  useEffect(() => {
    const onBackPress = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true; // handled
      }
      return false; // allow app to exit if no screen to go back
    };

    // ✅ MODERN API (IMPORTANT)
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    // ✅ CLEANUP (THIS FIXES YOUR ERROR)
    return () => subscription.remove();
  }, [navigation]);
}
