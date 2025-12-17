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
export const saveAttendanceState = async ({ employeeId, lastAction, checkInTime, checkOutTime }) => {
  try {
    const key = `attendance_state_${employeeId}`;
    const data = JSON.stringify({
      last_action: lastAction,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      cached_at: new Date().toISOString(),
    });
    await AsyncStorage.setItem(key, data);
  } catch (e) {
    console.warn("Failed to cache attendance state", e);
  }
};

export const getAttendanceState = async ({ employeeId }) => {
  try {
    const key = `attendance_state_${employeeId}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn("Failed to load attendance state", e);
    return null;
  }
};

export const clearSessionData = async () => {
  // Get all attendance cache keys and clear them
  const allKeys = await AsyncStorage.getAllKeys();
  const attendanceKeys = allKeys.filter(k => k.startsWith('attendance_'));

  // Core session keys to clear
  const sessionKeys = [
    "user_id",
    "userId",
    "employee_id",
    "emp_id",
    "domain_name",
    "user_email",
    "company_id",
    "user_type",
    "employee_name",
    "company_raw_userinfo",
    "auth_token",
    "access_token",
    "refresh_token",
  ];

  // Combine and remove all
  await AsyncStorage.multiRemove([...sessionKeys, ...attendanceKeys]);
};
