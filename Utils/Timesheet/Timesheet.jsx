import axios from "axios";
const API_BASE_URL = `http://127.0.0.1:8000/api/`;

export const fetchEmployeesApi = async (organizationId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}currentEmployee/?organization_id=${organizationId}`
    );

    if (response.data?.data) {
      return response.data.data.map((emp) => {
        // derive username from email if not provided
        const username = emp.email
          ? emp.email.split("@")[0].toLowerCase()
          : emp.full_name.replace(/\s+/g, "").toLowerCase();

        return {
          id: emp.user_id,
          name: emp.full_name,
          initials: emp.full_name
            .split(" ")
            .map((n) => n[0])
            .join(""),
          profilePic: emp.profile_pic,
          username,
        };
      });
    }

    return [];
  } catch (err) {
    console.error("Failed to load employees:", err);
    return [];
  }
};

/**
 * Fetch team members for a given leader (user_id).
 * @param {string} leaderId - user_id of the leader
 * @returns {Promise<Array>} - list of team member objects
 */
export const fetchTeamMembersApi = async () => {
  const user_id = sessionStorage.getItem("user_id");
  try {
    const response = await axios.get(
      `${API_BASE_URL}team-members-by-leader/${user_id}/`
    );

    if (response.data?.data) {
      return response.data.data.map((emp) => {
        const username = emp.email
          ? emp.email.split("@")[0].toLowerCase()
          : (emp.full_name ? emp.full_name.replace(/\s+/g, "").toLowerCase() : "unknown");
      
        return {
          id: emp.user_id,
          name: emp.full_name || "Unknown",
          initials: emp.full_name
            ? emp.full_name.split(" ").map((n) => n[0]).join("")
            : "",
          profilePic: emp.profile_pic || `https://i.pravatar.cc/150?u=${emp.user_id}`,
          username,
        };
      });      
    }

    return [];
  } catch (err) {
    console.error("Failed to load team members:", err);
    return [];
  }
};

/**
 * Fetch timesheets for given user & dates
 * @param {number|string} userId
 * @param {Date[]} dates
 * @param {function} calculateHours - optional callback
 * @returns {Promise<object>}
 */
export const fetchTimesheetsByDates = async (userId, dates, calculateHours) => {
  const results = {};

  await Promise.all(
    dates.map(async (date) => {
      const dateStr = date.toISOString().split("T")[0];
      const key = `${userId}-${dateStr}`;

      try {
        const response = await axios.get(
          `${API_BASE_URL}get-timesheets-by-date/?user_id=${userId}&date=${dateStr}`,
          { withCredentials: true }
        );
        const timesheets = response?.data?.data || [];
        results[key] = calculateHours
          ? calculateHours(timesheets)
          : timesheets;
      } catch (err) {
        console.error("Error fetching timesheet:", err);
        results[key] = calculateHours
          ? { totalHours: 0, projectHours: {} }
          : [];
      }
    })
  );

  return results;
};
