import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasLocationPermission,
  requestLocationPermission,
  checkLocationEnabled,
  getCurrentLocation,
} from "./locationHelper";

const LOCATION_KEY = "@last_known_location";
const LOCATION_TIME_KEY = "@last_known_location_time";

// 1️⃣ Start background location fetch
export async function startBackgroundLocation() {
  try {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return false;
    }

    const enabled = await checkLocationEnabled();
    if (!enabled) return false;

    // Fetch location ONCE (warm-up)
    const loc = await getCurrentLocation();

    if (!loc) return false;

    await AsyncStorage.setItem(
      LOCATION_KEY,
      JSON.stringify({
        latitude: loc.latitude,
        longitude: loc.longitude,
      })
    );
    await AsyncStorage.setItem(
      LOCATION_TIME_KEY,
      String(Date.now())
    );

    return true;
  } catch (e) {
    console.warn("Background location failed:", e);
    return false;
  }
}

// 2️⃣ Read cached location
export async function getCachedLocation(maxAgeMs = 2 * 60 * 1000) {
  try {
    const loc = await AsyncStorage.getItem(LOCATION_KEY);
    const time = await AsyncStorage.getItem(LOCATION_TIME_KEY);

    if (!loc || !time) return null;

    const age = Date.now() - Number(time);
    if (age > maxAgeMs) return null;

    return JSON.parse(loc); // { latitude, longitude }
  } catch {
    return null;
  }
}
export async function triggerBackgroundRefresh() {
  try {
    // fire-and-forget warm-up
    startBackgroundLocation();
  } catch (e) {
    console.warn("Silent location refresh failed", e);
  }
}
