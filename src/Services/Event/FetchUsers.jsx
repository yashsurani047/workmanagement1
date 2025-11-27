import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://taboodi.com/api';

const getAuthHeaders = async () => {
  try {
    const tryKeys = async (keys) => {
      for (const k of keys) {
        const v = await AsyncStorage.getItem(k);
        if (v && String(v).trim().length > 0 && String(v).toLowerCase() !== 'null' && String(v).toLowerCase() !== 'undefined') return v;
      }
      return null;
    };
    let token = await tryKeys(['userToken', 'token', 'authToken', 'accessToken', 'access_token']);
    if (!token) {
      const raw = await AsyncStorage.getItem('userInfo');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          token = parsed?.token || parsed?.authToken || parsed?.accessToken || parsed?.access_token || parsed?.access?.token || parsed?.credentials?.token || null;
        } catch {}
      }
    }
    if (!token) return {};
    const trimmed = String(token).trim();
    const hasPrefix = /^bearer\s|^token\s/i.test(trimmed);
    const authValue = hasPrefix ? trimmed : `Bearer ${trimmed}`;
    return { Authorization: authValue };
  } catch { return {}; }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const apiFetch = async (endpoint, tag = 'event:getOrganizationUsers', options = {}) => {
  const { retries = 2, timeoutMs = 10000 } = options;
  let attempt = 0;
  while (attempt <= retries) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE}${endpoint}`, { headers: { ...headers, Connection: 'close' }, signal: controller?.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.text();
      let data = null;
      try { if (raw && raw.trim().length > 0) data = JSON.parse(raw); } catch { data = null; }
      if (timer) clearTimeout(timer);
      return { success: true, data };
    } catch (e) {
      if (timer) clearTimeout(timer);
      const message = e instanceof Error ? e.message : 'Unknown error';
      const isAbort = message?.toLowerCase().includes('aborted') || message?.toLowerCase().includes('timeout');
      const isConnReset = message?.toLowerCase().includes('connection reset') || message?.toLowerCase().includes('incomplete envelope');
      const shouldRetry = attempt < retries && (isAbort || isConnReset || message?.startsWith('HTTP 5'));
      if (!shouldRetry) return { success: false, error: message };
      const backoff = 300 * Math.pow(2, attempt);
      await sleep(backoff);
      attempt += 1;
    }
  }
  return { success: false, error: 'Unknown error' };
};

const tryEndpoints = async (candidates, tag) => {
  for (const ep of candidates) {
    const res = await apiFetch(ep, `${tag}:${ep}`);
    if (res?.success) return res;
  }
  return { success: false, error: `All endpoints failed for ${tag}` };
};

export const getOrganizationUsers = (organizationId) =>
  tryEndpoints(
    [
      `/get-username/${organizationId}/`,
      `/organizations/${organizationId}/users/`,
      `/users/organizations/${organizationId}/`,
    ],
    'getOrganizationUsers'
  );

