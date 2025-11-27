// src/Services/Meeting/MeetingsService.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrganizationUsers } from '../Project/FetchprojectUsers';

export const API_BASE_URL = 'https://taboodi.com/api/';

const getAuthContext = async () => {
  const organizationId = (await AsyncStorage.getItem('organization_id')) || 'one';
  const token = await AsyncStorage.getItem('token');
  const userInfoRaw = await AsyncStorage.getItem('userInfo');
  const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
  const creator_id = (await AsyncStorage.getItem('user_id')) || userInfo?.user_id || userInfo?.id || '';
  return { organizationId, token, creator_id };
};

export const getMeeting = async (meetingId) => {
  try {
    if (!meetingId) return { success: false, error: 'Invalid meetingId' };
    const { organizationId, token } = await getAuthContext();
    const base = `${API_BASE_URL}organizations/${organizationId}/meetings/${meetingId}`;
    const candidates = [
      `${base}/`,
      `${base}`,
      `${base}/detail/`,
    ];

    let lastError = 'Unknown error';
    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const raw = await response.text();
        const ct = response.headers.get('content-type') || '';
        let data = null;
        try { if (ct.includes('application/json') && raw && raw.trim().length > 0) data = JSON.parse(raw); } catch {}
        if (!response.ok) {
          lastError = data?.error || data?.message || raw || `HTTP ${response.status}`;
          continue;
        }
        const meeting = data?.meeting || data?.data || data;
        return { success: true, meeting };
      } catch (inner) {
        lastError = inner?.message || lastError;
        continue;
      }
    }
    return { success: false, error: lastError };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to fetch meeting' };
  }
};

export const updateMeeting = async (meetingId, payload) => {
  const { organizationId, token, creator_id } = await getAuthContext();

  if (!meetingId) return { success: false, error: 'Invalid meetingId' };

  const body = {
    title: String(payload.title || '').trim(),
    description: String(payload.description || ''),
    start_time: toApiDateTime(payload.start_time),
    end_time: toApiDateTime(payload.end_time),
    meeting_scope: payload.meeting_scope,
    meeting_type: payload.meeting_type,
    meeting_url: String(payload.meeting_url || ''),
    location: String(payload.location || ''),
    creator_id: payload.creator_id || creator_id,
    participants: Array.isArray(payload.participants) ? payload.participants : [],
    external_emails: Array.isArray(payload.external_emails) ? payload.external_emails : [],
    agenda_items: Array.isArray(payload.agenda_items) ? payload.agenda_items : [],
    send_notifications: !!payload.send_notifications,
    sort_order: payload.sort_order ?? 0,
  };

  if (!body.title) return { success: false, error: 'Title is required' };
  if (!body.start_time || !body.end_time) return { success: false, error: 'Start/End time required' };

  const url = `${API_BASE_URL}organizations/${organizationId}/meetings/${meetingId}/update/`;
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data = null;
    try { if (raw && raw.trim().length > 0) data = JSON.parse(raw); } catch { data = null; }

    if (!response.ok) {
      return { success: false, error: data?.error || data?.message || raw || `HTTP ${response.status}` };
    }

    return { success: true, meeting: data?.meeting || data?.data || data };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to update meeting' };
  }
};

// Delete a meeting by ID with confirmation handled at caller level
export const deleteMeeting = async (meetingId) => {
  try {
    if (!meetingId) return { success: false, error: 'Invalid meetingId' };
    const { organizationId, token, creator_id } = await getAuthContext();
    const userInfoRaw = await AsyncStorage.getItem('userInfo');
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
    const userId = (await AsyncStorage.getItem('user_id')) || userInfo?.user_id || userInfo?.id || '';

    const url = `${API_BASE_URL}organizations/${organizationId}/meetings/${meetingId}/delete/`;
    const res = await fetch(`${url}?user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' });

    const raw = await res.text();
    let data = null;
    try { if (raw && raw.trim().length > 0) data = JSON.parse(raw); } catch {}

    if (!res.ok) {
      return { success: false, error: data?.error || data?.message || raw || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to delete meeting' };
  }
};

export const toApiDateTime = (d) => {
  if (!d) return '';
  try {
    // Format: YYYY-MM-DDTHH:MM:SS (no timezone) if backend expects naive
    const pad = (n) => String(n).padStart(2, '0');
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const day = pad(dt.getDate());
    const h = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    const s = pad(dt.getSeconds());
    return `${y}-${m}-${day}T${h}:${mi}:${s}`;
  } catch {
    return '';
  }
};

export const createMeeting = async (payload) => {
  const { organizationId, token, creator_id } = await getAuthContext();

  const body = {
    title: String(payload.title || '').trim(),
    description: String(payload.description || ''),
    start_time: toApiDateTime(payload.start_time),
    end_time: toApiDateTime(payload.end_time),
    meeting_scope: payload.meeting_scope, // 'internal' | 'external'
    meeting_type: payload.meeting_type,   // 'virtual' | 'in_person' | 'hybrid'
    meeting_url: String(payload.meeting_url || ''),
    location: String(payload.location || ''),
    creator_id: payload.creator_id || creator_id,
    participants: Array.isArray(payload.participants) ? payload.participants : [],
    external_emails: Array.isArray(payload.external_emails) ? payload.external_emails : [],
    agenda_items: Array.isArray(payload.agenda_items) ? payload.agenda_items : [],
    send_notifications: !!payload.send_notifications,
    sort_order: payload.sort_order ?? 0,
  };

  if (!body.title) return { success: false, error: 'Title is required' };
  if (!body.start_time || !body.end_time) return { success: false, error: 'Start/End time required' };

  const url = `${API_BASE_URL}organizations/${organizationId}/meetings/`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data = null;
    try { if (raw && raw.trim().length > 0) data = JSON.parse(raw); } catch { data = null; }

    if (!response.ok) {
      return { success: false, error: data?.error || data?.message || raw || `HTTP ${response.status}` };
    }

    return { success: true, meeting: data?.meeting || data?.data || data };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to create meeting' };
  }
};

export const fetchParticipants = async () => {
  try {
    const { organizationId } = await getAuthContext();
    const res = await getOrganizationUsers(organizationId);
    if (!res?.success) {
      return { success: false, error: res?.error || res?.message || 'Failed to fetch users' };
    }
    const data = res.data;
    const users = Array.isArray(data) ? data : (data?.users || data?.data || []);
    return { success: true, users: Array.isArray(users) ? users : [] };
  } catch (e) {
    return { success: false, error: e?.message || 'Failed to fetch users' };
  }
};
