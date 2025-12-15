// src/services/hrmsAuth.js

import Config from "react-native-config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = Config.HRMS_UTILITY_API_URL;
const HRMS_SECRET ="MEEPL_BEARER_TOKEN_OAUTH_HRMS_UTILITY_API_SECRET";

// In-memory cache so we don't hit AsyncStorage every time
let inMemoryToken = null;
// Used to avoid multiple parallel refreshes
let refreshPromise = null;

async function saveToken(token) {
  inMemoryToken = token;
  await AsyncStorage.setItem("hrmsbearertoken", token);
}

async function loadToken() {
  if (inMemoryToken) return inMemoryToken;
  const stored = await AsyncStorage.getItem("hrmsbearertoken");
  inMemoryToken = stored;
  return stored;
}

export async function generateHrmsBearerToken() {
  // If a refresh is already in progress, wait for that one
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const res = await fetch(`${BASE_URL}/auth/GenerateHrmsBearerToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hrms_secret: HRMS_SECRET,
      }),
    });


    const text = await res.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("Failed to parse HRMS token response:", e);
    }

    if (!res.ok) {
      console.error("GenerateHrmsBearerToken failed:", text);
      throw new Error(
        json?.error?.[0]?.message ||
          `Unable to generate HRMS token (HTTP ${res.status})`
      );
    }

    // Web code does: response.data.data
    const token = json?.data;
    if (!token) {
      throw new Error("HRMS token missing in response");
    }

    await saveToken(token);
    return token;
  })();

  try {
    const token = await refreshPromise;
    return token;
  } finally {
    // allow future refreshes
    refreshPromise = null;
  }
}

export async function getHrmsBearerToken() {
  const stored = await loadToken();
  if (stored) return stored;

  // No token stored yet → create one
  const token = await generateHrmsBearerToken();
  return token;
}
