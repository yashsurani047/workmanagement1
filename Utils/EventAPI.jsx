import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // No trailing slash

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const createUpdateEvent = async (eventData) => {
    try {
        const method = eventData.event_id ? 'put' : 'post';
        const url = eventData.event_id 
            ? `/events/${eventData.event_id}/update/` 
            : '/events/';
        
        // Ensure we're sending the data in the correct format
        const payload = {
            ...eventData,
            notification_minutes: parseInt(eventData.notification_minutes, 10) || 0,
            all_day: Boolean(eventData.all_day),
            video_conference: Boolean(eventData.video_conference)
        };

        const response = await axios({
            method,
            url,
            data: payload
        });

        return response.data;
    } catch (error) {
        if (error.response) {
            // Server responded with error status
            const detailedError = new Error(
                `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`
            );
            detailedError.response = error.response;
            throw detailedError;
        } else if (error.request) {
            // Request made but no response received
            throw new Error('No response from server. Please check your connection and ensure the Django server is running.');
        } else {
            // Something else happened
            throw error;
        }
    }
};

// Your other API functions remain the same...
export const getOrganizationEvents = async (organizationId, startDate, endDate) => {
    try {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        
        const response = await axios.get(`/organizations/${organizationId}/events/`, { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};
// Utils/EventAPI.js
export const getUserEvents = async (organizationId, userId) => {
    try {
        console.log(`Fetching events for user ${userId} in organization ${organizationId}`);
        const response = await axios.get(`/organizations/${organizationId}/user-events/${userId}/`);
        console.log('User events API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user events:', error);
        if (error.response) {
            console.error('Server response:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw error;
    }
};

export const getAllUserEvents = async (organizationId, userId) => {
  try {
    const response = await getUserEvents(organizationId, userId);
    
    // Handle different response formats
    if (response && response.success) {
      return response.events || [];
    } else if (Array.isArray(response)) {
      return response;
    } else if (response && response.events) {
      return response.events;
    } else if (response && response.data) {
      return response.data;
    }
    
    console.warn('Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error("Failed to fetch user events:", error);
    return [];
  }
};

export const getCurrentUserInfo = () => {
  const username = sessionStorage.getItem("username");
  const userId = sessionStorage.getItem("user_id") || "48413637481836414348434848";
  const orgId = sessionStorage.getItem("organization_id") || "one";
  
  console.log('Current user info:', { username, userId, orgId });
  
  return {
    username,
    userId,
    orgId
  };
};

export const getEventDetails = async (eventId) => {
    try {
        const response = await axios.get(`/events/${eventId}/details/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteEvent = async (eventId) => {
    try {
        const response = await axios.post(`/events/${eventId}/delete/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getOrganizationUsers = async (organizationId) => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000/api/get-username/${organizationId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const shareEvent = async (shareData) => {
  try {
    const { organization_id, user_id, event_id, user_ids = [], external_contacts = [] } = shareData;
    const response = await axios.post(`/events/${organization_id}/${user_id}/${event_id}/share/`, {
      user_ids,
      external_contacts
    });
    return response.data;
  } catch (error) {
    console.error('Error in shareEvent API:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    throw error;
  }
};