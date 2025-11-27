// src/Services/userApi.jsx
import { getAuthToken } from "./authServices";
import { BASE_URL } from "../../Config/api";

export const getCurrentUserProfile = async () => {
  try {
    const token = await getAuthToken();

    if (!token) {
      return { success: false, error: "No authentication token found" };
    }

    console.log("Fetching current user profile...");
    const response = await fetch(`${BASE_URL}/user/profile/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Profile response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Profile fetch error:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Profile data received:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    return { success: false, error: error.message };
  }
};