import axios from "axios";

const BASE_URL = "https://test.taboodi.com/api";

export const fetchTeamMembersByLeader = async (leaderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/team-members-by-leader/${leaderId}/`);
    if (response.data.status === "success") {
      return response.data.data;
    } else {
      throw new Error("Failed to fetch team members");
    }
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
};

export const fetchUserActivityTimeline = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user-activity/${userId}/`);
    if (response.data.status === "success") {
      console.log(`📊 Fetched ${response.data.data.length} activities with status_change and notes fields`);
      
      // Debug: Check if status updates are coming through
      const statusUpdates = response.data.data.filter(activity => 
        activity.activity_type === 'Status Update'
      );
      
      if (statusUpdates.length > 0) {
        console.log('🔄 Status Updates found:', statusUpdates.map(update => ({
          type: update.activity_type,
          status: update.status_change,
          notes: update.notes,
          description: update.activity_description,
          timestamp: update.activity_time
        })));
      }
      
      // Log all activity types for debugging
      const activityTypes = [...new Set(response.data.data.map(activity => activity.activity_type))];
      console.log('📋 Activity types in timeline:', activityTypes);
      
      return response.data.data;
    } else {
      throw new Error("Failed to fetch user activity");
    }
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return [];
  }
};