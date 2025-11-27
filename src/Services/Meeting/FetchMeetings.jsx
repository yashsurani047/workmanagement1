// src/Services/FetchMeetings.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://taboodi.com/api/';

const formatDateISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Fetch meetings for a given yyyy-mm-dd (string) or Date
export const fetchMeetings = async (opts = {}) => {
  try {
    const { startDate, organizationId: orgOverride, username: userOverride } = opts || {};

    const userInfoRaw = await AsyncStorage.getItem('userInfo');
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
    const storedUserToken = await AsyncStorage.getItem('userToken');
    const storedToken = await AsyncStorage.getItem('token');
    const authToken = storedUserToken || storedToken || userInfo?.token || null;
    const organizationId = orgOverride || (await AsyncStorage.getItem('organization_id')) || userInfo?.organization_id || 'one';
    // Prefer explicit username, then known username fields, then fall back to user_id or userId stored
    const storedUsername = await AsyncStorage.getItem('username');
    const storedUserId = await AsyncStorage.getItem('user_id');
    const storedUserIdAlt = await AsyncStorage.getItem('userId');
    const username = userOverride || storedUsername || userInfo?.user_name || userInfo?.username || userInfo?.user_id || storedUserId || storedUserIdAlt || '';

    let dateParam = '';
    if (!startDate) {
      dateParam = formatDateISO(new Date());
    } else if (startDate instanceof Date) {
      dateParam = formatDateISO(startDate);
    } else if (typeof startDate === 'string') {
      dateParam = startDate;
    }

    const attempt = async (userKey) => {
      const testUrl = `${API_BASE_URL}organizations/${organizationId}/users/${userKey}/meetings/?start_date=${dateParam}`;
      console.log('[Meetings] Fetching', { organizationId, username: userKey, dateParam, url: testUrl });
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const resp = await fetch(testUrl, { headers });
      const ct = resp.headers.get('content-type') || '';
      const text = await resp.text();
      let json = null;
      try {
        if (ct.includes('application/json') && text && text.trim().length > 0) json = JSON.parse(text);
      } catch (_) {}
      if (!resp.ok) {
        const msg = json?.message || json?.error || text || `Failed (HTTP ${resp.status})`;
        console.warn('[Meetings] Attempt failed', { userKey, status: resp.status, msg });
        return { ok: false, meetings: [], error: msg };
      }
      const arr = Array.isArray(json?.meetings) ? json.meetings : [];
      console.log('[Meetings] Attempt received count:', arr.length, 'for', userKey);
      return { ok: true, meetings: arr };
    };

    const candidates = Array.from(new Set([
      username,
      storedUsername,
      userInfo?.user_name,
      userInfo?.username,
      userInfo?.user_id,
      storedUserId,
      storedUserIdAlt,
    ].filter(Boolean)));

    for (const key of candidates) {
      const res = await attempt(key);
      if (res.ok && res.meetings.length > 0) {
        return { success: true, meetings: res.meetings };
      }
    }

    // If all attempts failed or returned empty, return last state
    return { success: true, meetings: [] };
  } catch (error) {
    console.error('[Meetings] Error', error?.message);
    return { success: false, error: error.message, meetings: [] };
  }
};
