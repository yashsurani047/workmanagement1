import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://taboodi.com/api";

const getAuthHeaders = async () => {
  try {
    const tryKeys = async (keys) => {
      for (const k of keys) {
        const v = await AsyncStorage.getItem(k);
        if (v && String(v).trim().length > 0 && String(v).toLowerCase() !== 'null' && String(v).toLowerCase() !== 'undefined') return v;
      }
      return null;
    };
    // Direct token keys first
    let token = await tryKeys([
      "userToken",
      "token",
      "authToken",
      "accessToken",
      "access_token",
      "user_token",
      "jwtToken",
      "jwt",
      "sessionToken",
    ]);

    // Then look into userInfo shape(s)
    if (!token) {
      const raw = await AsyncStorage.getItem("userInfo");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          token =
            parsed?.token ||
            parsed?.authToken ||
            parsed?.accessToken ||
            parsed?.access_token ||
            parsed?.access?.token || // nested access object
            parsed?.credentials?.token ||
            null;
        } catch {}
      }
    }

    if (!token) return {};

    const trimmed = String(token).trim();
    const hasPrefix = /^bearer\s|^token\s/i.test(trimmed);
    const authValue = hasPrefix ? trimmed : `Bearer ${trimmed}`;
    return { Authorization: authValue };
  } catch {
    return {};
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// apiFetch with timeout and retry. Backwards compatible signature.
const apiFetch = async (endpoint, tag = "fetchuser", options = {}) => {
  const { retries = 2, timeoutMs = 10000 } = options;
  let attempt = 0;
  while (attempt <= retries) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}${endpoint}`,
        { headers: { ...headers, Connection: 'close' }, signal: controller?.signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.text();
      let data = null;
      try {
        if (raw && raw.trim().length > 0) data = JSON.parse(raw);
      } catch (_) {
        data = null;
      }
      if (timer) clearTimeout(timer);
      return { success: true, data };
    } catch (e) {
      if (timer) clearTimeout(timer);
      const message = e instanceof Error ? e.message : "Unknown error";
      const isAbort = message?.toLowerCase().includes('aborted') || message?.toLowerCase().includes('timeout');
      const isConnReset = message?.toLowerCase().includes('connection reset') || message?.toLowerCase().includes('incomplete envelope');
      const shouldRetry = attempt < retries && (isAbort || isConnReset || message?.startsWith('HTTP 5'));
      if (shouldRetry) {
        console.warn(`[${tag}] attempt ${attempt + 1} failed: ${message}`);
      } else {
        console.error(`[${tag}] giving up after ${attempt + 1} attempt(s): ${message}`);
      }
      if (!shouldRetry) {
        return { success: false, error: message };
      }
      const backoff = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
      await sleep(backoff);
      attempt += 1;
    }
  }
  return { success: false, error: 'Unknown error' };
};

// Try multiple endpoints in order until one succeeds (status 2xx)
const tryEndpoints = async (candidates, tag) => {
  for (const ep of candidates) {
    const res = await apiFetch(ep, `${tag}:${ep}`);
    if (res?.success) return res;
  }
  return { success: false, error: `All endpoints failed for ${tag}` };
};

export const getDepartments = (organizationId) => {
  const orgStr = String(organizationId ?? '').trim().toLowerCase();
  if (!orgStr || orgStr === 'one' || orgStr === 'null' || orgStr === 'undefined') {
    return Promise.resolve({ success: false, error: 'Invalid organizationId' });
  }
  return tryEndpoints(
    [
      `/departments/${organizationId}/`,
      `/organizations/${organizationId}/departments/`,
      `/departments/organizations/${organizationId}/list/`,
      `/organization/${organizationId}/departments/`,
    ],
    "getDepartments"
  );
};

export const getSubDepartments = (departmentId) =>
  tryEndpoints(
    [
      `/subdepartments/${departmentId}/`,
      `/departments/${departmentId}/subdepartments/`,
    ],
    "getSubDepartments"
  );

export const getMembersBySubDept = (subDepartmentId) =>
  tryEndpoints(
    [
      `/users/subdepartment/${subDepartmentId}/`,
      `/subdepartments/${subDepartmentId}/users/`,
    ],
    "getMembersBySubDept"
  );

export const getOrganizationUsers = (organizationId) =>
  tryEndpoints(
    [
      `/get-username/${organizationId}/`,
      `/organizations/${organizationId}/users/`,
      `/users/organizations/${organizationId}/`,
    ],
    "getOrganizationUsers"
  );

// Fetch a single project's details (includes assigned_users if backend returns it)
export const getProjectDetails = async (projectId) => {
  try {
    if (!projectId) throw new Error("projectId is required");

    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await (async () => {
        try {
          const raw = await AsyncStorage.getItem("userInfo");
          const parsed = raw ? JSON.parse(raw) : null;
          return parsed?.token || null;
        } catch { return null; }
      })());

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`${API_BASE}/projects/${projectId}/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Normalize assigned_users key (backend may use different shapes)
    const assigned = Array.isArray(data?.assigned_users)
      ? data.assigned_users
      : Array.isArray(data?.assignees)
      ? data.assignees
      : Array.isArray(data?.users)
      ? data.users
      : [];

    return { success: true, data: { ...data, assigned_users: assigned } };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[getProjectDetails]", message);
    return { success: false, message };
  }
};

// Fetch assigned users for a project explicitly
export const getProjectAssignedUsers = async (projectId) => {
  try {
    if (!projectId) throw new Error("projectId is required");

    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await (async () => {
        try {
          const raw = await AsyncStorage.getItem("userInfo");
          const parsed = raw ? JSON.parse(raw) : null;
          return parsed?.token || null;
        } catch { return null; }
      })());

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`${API_BASE}/projects/${projectId}/assignees/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : data.assignees || data.assigned_users || data.users || [];
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[getProjectAssignedUsers]", message);
    return { success: false, message };
  }
};

// Create/Update Project API (unified)
export const createProjectApi = async (projectData, isEditing = false) => {
  try {
    // Ensure user_id is present; robust fallbacks and sanitization
    let ensuredUserId = projectData?.user_id;
    let source = "payload.user_id";
    if (!ensuredUserId) {
      const storedUserId = (await AsyncStorage.getItem("userId")) || (await AsyncStorage.getItem("user_id"));
      const userInfoRaw = await AsyncStorage.getItem("userInfo");
      const parsed = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      ensuredUserId = storedUserId || parsed?.user_id || null;
      source = storedUserId ? "AsyncStorage.userId|user_id" : parsed?.user_id ? "userInfo.user_id" : source;
    }

    const uidStr = String(ensuredUserId ?? "").trim();
    const uidLower = uidStr.toLowerCase();
    const isBad = uidStr.length === 0 || uidLower === "null" || uidLower === "undefined";
    const digitsOnly = uidStr.replace(/\D+/g, "");
    const finalUserId = isBad ? null : digitsOnly.length > 0 ? digitsOnly : uidStr;

    console.log("[createProjectApi] user_id resolution:", { source, ensuredUserId: uidStr, finalUserId });

    if (!finalUserId) {
      return { success: false, message: "Missing or invalid user_id. Please re-login and try again." };
    }

    const formPayload = new FormData();
    const payload = {
      ...projectData,
      user_id: String(finalUserId),
      created_by: projectData?.created_by || String(finalUserId),
      assigned_by_user_id: projectData?.assigned_by_user_id || String(finalUserId),
    };

    // Resolve required identity fields if missing/empty
    try {
      const needUserId = !payload.user_id || String(payload.user_id).trim().length === 0 || String(payload.user_id).toLowerCase() === 'null' || String(payload.user_id).toLowerCase() === 'undefined';
      const needCreatedBy = !payload.created_by || String(payload.created_by).trim().length === 0 || String(payload.created_by).toLowerCase() === 'null' || String(payload.created_by).toLowerCase() === 'undefined';
      let resolvedUserId = null;
      if (needUserId || needCreatedBy) {
        const stored1 = await AsyncStorage.getItem('user_id');
        const stored2 = await AsyncStorage.getItem('userId');
        const infoRaw = await AsyncStorage.getItem('userInfo');
        const info = infoRaw ? JSON.parse(infoRaw) : null;
        resolvedUserId = stored1 || stored2 || info?.user_id || null;
        if (needUserId && resolvedUserId) payload.user_id = String(resolvedUserId);
        if (needCreatedBy && resolvedUserId) payload.created_by = String(resolvedUserId);
        if (!payload.assigned_by) payload.assigned_by = info?.username || info?.user_name || payload.assigned_by;
      }
      // Final guard: if still missing, fail fast with clear message
      if (!payload.user_id || String(payload.user_id).trim().length === 0) {
        return { success: false, message: 'Missing user_id. Please log in again.' };
      }
      if (!payload.created_by || String(payload.created_by).trim().length === 0) {
        return { success: false, message: 'Missing created_by. Please log in again.' };
      }
    } catch {}

    // Remove items that are handled by dedicated endpoints after project creation
    delete payload.assignees;
    delete payload.assigned_users;
    delete payload.links;
    delete payload.documents;

    // Add common backend aliases to maximize compatibility on update
    try {
      if (payload.name) {
        payload.title = payload.title || payload.name;
        payload.project_title = payload.project_title || payload.name;
        payload.project_name = payload.project_name || payload.name;
      }
      if (payload.description) {
        payload.project_description = payload.project_description || payload.description;
      }
    } catch {}

    Object.keys(payload).forEach((key) => {
      const val = payload[key];
      if (val === null || val === undefined) return;
      {
        // Do not append empty strings for required numeric/string identifiers
        const s = typeof val === 'string' ? val : String(val);
        if (s.trim().length === 0) return;
        formPayload.append(key, s);
      }
    });

    const headers = await getAuthHeaders();

    console.log("[createProjectApi] resolved user_id:", String(ensuredUserId));
    console.log("[createProjectApi] token present:", !!headers.Authorization);
    try {
      console.log("[createProjectApi] payload ids:", {
        user_id: payload.user_id,
        created_by: payload.created_by,
        assigned_by_user_id: payload.assigned_by_user_id,
        assigned_by: payload.assigned_by || projectData?.assigned_by || null,
      });
    } catch {}

    // Determine candidate endpoints for create vs update
    const pid = payload?.project_id || projectData?.project_id || null;
    const candidates = isEditing
      ? [
          `${API_BASE}/projects/${pid}/update/`,
          `${API_BASE}/projects/${pid}/update`,
          `${API_BASE}/projects/update/${pid}/`,
          `${API_BASE}/projects/update/`,
        ]
      : [
          `${API_BASE}/projects/create/`,
        ];

    let lastErr = null;
    for (const endpoint of candidates) {
      try {
        const method = isEditing ? "PUT" : "POST";
        const res = await fetch(endpoint, {
          method,
          headers: headers || {},
          body: formPayload,
        });
        if (!res.ok) {
          let msg = isEditing ? "Failed to update project" : "Failed to create project";
          try {
            const errData = await res.json();
            msg = errData.message || msg;
          } catch (_) {
            try { msg = await res.text(); } catch {}
          }
          throw new Error(`${msg}`);
        }
        const data = await res.json();
        return { success: true, data };
      } catch (e) {
        lastErr = e;
        // try next candidate
      }
    }
    // If all candidates failed
    throw lastErr || new Error(isEditing ? "Failed to update project" : "Failed to create project");
  } catch (err) {
    console.error("[createProjectApi]", err);
    return { success: false, message: err.message };
  }
};

export default {
  getDepartments,
  getSubDepartments,
  getMembersBySubDept,
  getOrganizationUsers,
  getProjectDetails,
  getProjectAssignedUsers,
};
