import { clearSessionData } from "../services/baseHelper";

/**
 * Convert technical errors into user-friendly messages
 */
export function getUserErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  const message = error.message || "";

  if (message === "SESSION_EXPIRED") {
    return "Your session expired. Please login again.";
  }

  if (message === "Network request failed") {
    return "No internet connection. Please check your network.";
  }

  if (message.includes("HTTP 500")) {
    return "Server error. Please try again later.";
  }

  if (message.includes("HTTP 404")) {
    return "Service unavailable. Please try later.";
  }

  return "Service temporarily unavailable.";
}

/**
 * Handle critical errors (like session expiry)
 */
export async function handleCriticalError(error, navigation) {
  if (error?.message === "SESSION_EXPIRED") {
    await clearSessionData();

    navigation.reset({
      index: 0,
      routes: [{ name: "Email" }],
    });
  }
}
