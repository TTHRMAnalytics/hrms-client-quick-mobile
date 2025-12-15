// src/services/api.js
import Config from "react-native-config";
import { getHrmsBearerToken, generateHrmsBearerToken } from "./hrmsAuth";
import { encryptPassword } from "../utils/crypto";

const BASE_URL = Config.HRMS_UTILITY_API_URL;
// generic request with HRMS bearer + 401 retry
async function request(path, options = {}, retry = true) {
  const token = await getHrmsBearerToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}

  // token expired â†’ refresh once and retry
  if (response.status === 401 && retry) {
    const newToken = await generateHrmsBearerToken();
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };
    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });
    const retryText = await retryRes.text();
    let retryJson = {};
    try {
      retryJson = retryText ? JSON.parse(retryText) : {};
    } catch {}
    if (!retryRes.ok) {
      if (retryRes.status === 401 || retryRes.status === 403) {
        throw new Error("SESSION_EXPIRED");
      }
      throw new Error(retryText || `HTTP ${retryRes.status}`);
    }

    return retryJson;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error(text || `HTTP ${response.status}`);
  }


  return json;
}

// --------- existing functions ----------
export async function getWorkspaces(email) {
  const res = await request("/user/getWorkspaces", {
    method: "POST",
    body: JSON.stringify({ user_id: email }),
  });
  return res.data || [];
}

export async function signIn({ userId, password, domain }) {
  const body = {
    userid: userId,
    password: encryptPassword(password),
    domain: domain,
  };

  const res = await request("/user/signIn", {
    method: "POST",
    body: JSON.stringify(body),
  });


  return res;
}

export async function getuserinfo({ userId, domain }) {
  const body = {
    user_emp_id: userId,
    workspace: domain,
  };


  const res = await request("/user/users", {
    method: "POST",
    body: JSON.stringify(body),
  });


  return res;
}

// --------- ðŸ”¥ NEW: Attendance API Functions ----------
const LMS_BASE_URL = Config.HRMS_LMS_API_URL;
// Helper for LMS API calls (different base URL)
async function lmsRequest(path, options = {}, retry = true) {
  const token = await getHrmsBearerToken();

  // ðŸ”¥ ADD THIS DEBUG LOG
  const fullUrl = `${LMS_BASE_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${LMS_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}

  // Token expired â†’ refresh once and retry
  if (response.status === 401 && retry) {
    const newToken = await generateHrmsBearerToken();
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    };
    const retryRes = await fetch(`${LMS_BASE_URL}${path}`, {
      ...options,
      headers: retryHeaders,
    });
    const retryText = await retryRes.text();
    let retryJson = {};
    try {
      retryJson = retryText ? JSON.parse(retryText) : {};
    } catch {}
    if (!retryRes.ok) {
      if (retryRes.status === 401 || retryRes.status === 403) {
        throw new Error("SESSION_EXPIRED");
      }
      throw new Error(retryText || `HTTP ${retryRes.status}`);
    }

    return retryJson;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error(text || `HTTP ${response.status}`);
  }


  return json;
}

export async function addFaceData({ employeeId, recordTime, entryType, domainName, userId, liveLocation }) {
  const payload = {
    domain_name: domainName,
    user_id: userId,
    emp_id: employeeId,
    record_time: recordTime,
    entry_type: entryType,
    live_location: liveLocation,
  };


  const res = await lmsRequest("/addFaceData", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res;
}

export function getErrorMessage(error) {
  if (!error) return "Something went wrong";

  if (error.message === "SESSION_EXPIRED") {
    return "Your session expired. Please login again.";
  }

  if (error.message === "Network request failed") {
    return "No internet connection";
  }

  if (error.message?.includes("HTTP 500")) {
    return "Server error. Please try later.";
  }

  return "Service temporarily unavailable";
}





// Get face data (attendance history)
export async function getFaceData({ fromDate, toDate, empId, domainName }) {
  const res = await lmsRequest("/getFaceData", {
    method: "POST",
    body: JSON.stringify({
      domain_name: domainName,
      from_date: fromDate,
      to_date: toDate,
      emp_id: empId,
    }),
  });
  return res;
}

// Log distance data (optional - for analytics)
export async function addDistanceLog({ empId, name, distance }) {
  try {
    const res = await lmsRequest("/log-distance", {
      method: "POST",
      body: JSON.stringify({
        emp_id: empId,
        name: name || "Mobile User",
        distance: distance || 0.3, // Dummy distance
        timestamp: new Date().toISOString(),
        userDescriptor: "", // Dummy - no face data
        liveDescriptor: "", // Dummy - no face data
      }),
    });
    return res;
  } catch (error) {
    // Don't throw - this is optional logging
    return null;
  }
}

// Get last attendance status for employee
export async function getEmployeeLastAttendanceStatus({ employeeId, domainName }) {
  const res = await lmsRequest("/getEmpLastAttendanceStatus", {
    method: "POST",
    body: JSON.stringify({
      domain_name: domainName,
      employee_id: employeeId,
    }),
  });

  return res;
}
