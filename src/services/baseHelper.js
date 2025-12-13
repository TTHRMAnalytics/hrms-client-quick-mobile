import AsyncStorage from "@react-native-async-storage/async-storage";

export const addSessionData = async ({ key, value }) => {
  await AsyncStorage.setItem(key, value);
};

export const getSessionData = async ({ key }) => {
  return await AsyncStorage.getItem(key);
};

export const removeSessionData = async ({ key }) => {
  await AsyncStorage.removeItem(key);
};

/**
 * Clears ONLY session-related data
 * ❌ Does NOT clear saved_email
 */
export const clearSessionData = async () => {
  await AsyncStorage.multiRemove([
    "user_id",
    "employee_id",
    "domain_name",
    "auth_token",
    "access_token",
    "refresh_token",
  ]);
};
