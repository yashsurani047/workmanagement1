import axios from "axios";
import { toast } from "react-toastify";
import { format } from "date-fns";

const API_BASE_URL = 'http://127.0.0.1:8000/api';
export const meetingAPI = {
  fetchMeetings: async (selectedDate) => {
    try {
      const userId = sessionStorage.getItem("user_id");
      const organizationId = sessionStorage.getItem("organization_id") || "one";

      console.log("Fetching meetings for:", {
        userId,
        organizationId,
        selectedDate: format(selectedDate, "yyyy-MM-dd"),
      });

      const response = await axios.get(
        `http://127.0.0.1:8000/api/organizations/${organizationId}/users/${userId}/meetings/?start_date=${format(
          selectedDate,
          "yyyy-MM-dd"
        )}`
      );

      console.log("Meetings response:", response.data);
      return response.data?.meetings || [];
    } catch (error) {
      console.error("Full error details:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);

      // Show more specific error message
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to load meetings";
      toast.error(errorMessage);
      return [];
    }
  },
  deleteMeeting: async (meetingId) => {
    try {
      const organizationId = sessionStorage.getItem("organization_id") || "one";
      const userId = sessionStorage.getItem("user_id");

      await axios.delete(
        `http://127.0.0.1:8000/api/organizations/${organizationId}/meetings/${meetingId}/delete/`,
        { params: { user_id: userId } }
      );

      return true;
    } catch (error) {
      console.error("Error deleting meeting:", error);
      throw new Error(
        error.response?.data?.error || "Failed to delete meeting"
      );
    }
  },
};

export const verifyMeetingToken = async (token, meetingId) => {
  try {
    console.log('🔐 REACT DEBUG - Verifying token:', { token, meetingId });
    
    const response = await axios.get(
      `http://127.0.0.1:8000/api/verify-meeting-token/`,
      {
        params: { 
          token: token,  // Send the token as-is, let Django handle decoding
          meeting_id: meetingId 
        }
      }
    );
    
    console.log('🔐 REACT DEBUG - Verification response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('🔐 REACT DEBUG - Token verification error:', error);
    console.error('🔐 REACT DEBUG - Error response:', error.response?.data);
    
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Token verification failed'
    );
  }
};

export const getMeetingDetails = async (meetingId, token = null) => {
  try {
    let url;
    let params = {};
    
    if (token) {
      // External participant - use the meeting-details endpoint with token
      url = `${API_BASE_URL}/meetings/${meetingId}/`;
      params.token = token;
    } else {
      // Internal participant - you might need to use a different endpoint
      // Since your GetMeetingDetailsView requires organization_id and user_id
      const userId = sessionStorage.getItem("user_id");
      const organizationId = sessionStorage.getItem("organization_id") || "one";
      
      url = `${API_BASE_URL}/organizations/${organizationId}/meetings/${meetingId}/details/`;
      params.user_id = userId;
    }

    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error('Meeting details error:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.details || 
      'Failed to fetch meeting details'
    );
  }
};