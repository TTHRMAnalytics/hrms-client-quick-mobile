// src/utils/errorHandler.js
import { clearSessionData } from "../services/baseHelper";

/**
 * Convert technical errors into user-friendly messages
 * NO developer errors should reach the user
 */

export function getUserErrorMessage(error, context = '') {
  if (!error) return "Something went wrong. Please try again.";

  const message = error.message || error.toString() || "";
  const statusCode = error.status || error.statusCode;

  // ========== SESSION & AUTH ERRORS ==========
  if (message === "SESSION_EXPIRED" || statusCode === 401 || statusCode === 403) {
    return "Your session has expired. Please login again.";
  }

  // ========== NETWORK ERRORS ==========
  if (message === "Network request failed" || message.includes("network")) {
    return "No internet connection. Please check your network and try again.";
  }

  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return "Connection timeout. Please check your network and try again.";
  }

  // ========== SERVER ERRORS ==========
  if (statusCode === 500 || message.includes("HTTP 500") || message.includes("500")) {
    return "Server is temporarily unavailable. Please try again later.";
  }

  if (statusCode === 502 || message.includes("HTTP 502") || message.includes("502")) {
    return "Service is temporarily down. Please try again later.";
  }

  if (statusCode === 503 || message.includes("HTTP 503") || message.includes("503")) {
    return "Service is under maintenance. Please try again later.";
  }

  if (statusCode === 504 || message.includes("HTTP 504") || message.includes("504")) {
    return "Request timeout. Please try again.";
  }

  if (statusCode === 404 || message.includes("HTTP 404") || message.includes("404")) {
    return "Service not found. Please contact support.";
  }

  // ========== CONTEXT-SPECIFIC ERRORS ==========
  switch (context) {
    case 'email':
      return "Invalid email address. Please enter a valid email.";

    case 'password':
      return "Incorrect password. Please try again.";

    case 'workspace':
      return "No workspace found for this email. Please check and try again.";

    case 'login':
      if (message.includes("invalid") || message.includes("incorrect")) {
        return "Incorrect email or password. Please try again.";
      }
      return "Login failed. Please check your credentials and try again.";

    case 'attendance':
      return "Unable to record attendance. Please try again.";

    case 'location':
      return "Unable to get your location. Please enable location and try again.";

    default:
      break;
  }

  // ========== VALIDATION ERRORS ==========
  if (message.includes("required") || message.includes("empty") || message.includes("blank")) {
    return "Please fill in all required fields.";
  }

  if (message.includes("invalid email") || message.includes("email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("password")) {
    return "Invalid password. Please try again.";
  }

  // ========== DEFAULT FALLBACK ==========
  // NEVER show technical errors to users
  return "Something went wrong. Please try again later.";
}

/**
 * Handle critical errors (like session expiry) that require logout
 */
export async function handleCriticalError(error, navigation) {
  const message = error?.message || "";
  const statusCode = error?.status || error?.statusCode;

  if (message === "SESSION_EXPIRED" || statusCode === 401 || statusCode === 403) {
    await clearSessionData();
    navigation.reset({
      index: 0,
      routes: [{ name: "Email" }],
    });
    return true;
  }
  return false;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get user-friendly validation messages
 */
export function getValidationMessage(field, value) {
  if (!value || !value.trim()) {
    switch (field) {
      case 'email':
        return "Please enter your email address.";
      case 'password':
        return "Please enter your password.";
      case 'workspace':
        return "Please select a workspace.";
      default:
        return `Please enter ${field}.`;
    }
  }

  if (field === 'email' && !isValidEmail(value)) {
    return "Please enter a valid email address.";
  }

  if (field === 'password' && value.length < 4) {
    return "Password is too short. Please enter a valid password.";
  }

  return null;
}
