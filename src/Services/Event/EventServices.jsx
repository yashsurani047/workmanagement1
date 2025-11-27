import axios from 'axios';

export const API_BASE_URL = 'https://taboodi.com/api/';

const api = axios.create({ baseURL: API_BASE_URL });

export const getOrganizationEvents = async (organizationId, startDate, endDate) => {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const response = await api.get(`organizations/${organizationId}/events/`, { params });
  return response.data;
};

export const getUserEvents = async (organizationId, userId) => {
  const candidates = [
    `organizations/${organizationId}/user-events/${userId}/`,
    `organizations/${organizationId}/user-events/${userId}`,
    `organizations/${organizationId}/users/${userId}/events/`,
    `users/${userId}/events/`,
  ];
  let lastErr = null;
  for (const path of candidates) {
    try {
      const response = await api.get(path);
      return response.data;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Failed to fetch user events');
};

export const deleteEvent = async (eventId) => {
  const response = await api.post(`events/${eventId}/delete/`);
  return response.data;
};

export const getEventDetails = async (eventId) => {
  const candidates = [
    `events/${eventId}/`,
    `events/${eventId}`,
    `events/${eventId}/details/`,
  ];
  let lastErr = null;
  for (const path of candidates) {
    try {
      const response = await api.get(path);
      return response.data;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Failed to fetch event details');
};

export const createUpdateEvent = async (eventData) => {
  try {
    const method = eventData.event_id ? 'put' : 'post';
    const url = eventData.event_id ? `events/${eventData.event_id}/update/` : 'events/';

    const clone = { ...(eventData || {}) };
    const idsFromParticipants = Array.isArray(clone.participants) ? clone.participants : [];
    const idsFromInternalGuestIds = Array.isArray(clone.internal_guest_ids) ? clone.internal_guest_ids : [];
    const idsFromInternalGuests = Array.isArray(clone.internal_guests)
      ? clone.internal_guests.map((g) => (typeof g === 'object' ? g?.user_id : g)).filter(Boolean)
      : [];
    const rawIds = (idsFromInternalGuestIds.length > 0
      ? idsFromInternalGuestIds
      : (idsFromParticipants.length > 0 ? idsFromParticipants : idsFromInternalGuests))
      .map((x) => String(x))
      .filter((x) => x !== '' && x !== 'null' && x !== 'undefined');
    const stringIds = rawIds;
    const numericIds = rawIds.map((x) => {
      const n = Number(x);
      return Number.isNaN(n) ? x : n;
    });
    if (stringIds.length > 0) {
      // Provide both forms; backend may accept either
      clone.internal_guest_ids = stringIds;
      clone.participants = numericIds;
    }

    const payload = {
      ...clone,
      notification_minutes: parseInt(clone.notification_minutes, 10) || 0,
      all_day: Boolean(clone.all_day),
      video_conference: Boolean(clone.video_conference),
    };

    const response = await api({ method, url, data: payload });
    return response.data;
  } catch (error) {
    if (error.response) {
      const detailedError = new Error(
        `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`
      );
      detailedError.response = error.response;
      throw detailedError;
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection and ensure the Django server is running.');
    } else {
      throw error;
    }
  }
};

