// Services/fetchProjectsAPI.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../Utils/apiUtils";
import axios from "axios";

const PROJECTS_BASE_URL = "https://taboodi.com/api/";
const DELETE_BASE_URL = "https://taboodi.com/api/";

/**
 * Fetch projects for a specific user and organization.
 * Route: GET /projects/organization/{orgId}/user/{userId}
 */
export const fetchProjectsAPI = async ({ token, userId, orgId }) => {
  console.log("📡 Fetching projects from API...");

  try {
    if (!userId) throw new Error("User ID is missing.");
    if (!orgId) orgId = "one";

    const headers = { "Content-Type": "application/json", "Cache-Control": "no-cache", Pragma: "no-cache" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const bust = Date.now();
    const url = `${PROJECTS_BASE_URL}projects/organization/${orgId}/user/${userId}/?t=${bust}`;
    console.log("🌐 Projects API URL:", url);

    const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text.slice(0, 200));
      throw new Error("Server did not return valid JSON. Check the API endpoint.");
    }

    const projects = Array.isArray(data)
      ? data
      : data.projects || data.data || data.results || [];

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch projects.");
    }

    console.log("✅ Projects fetched:", Array.isArray(projects) ? projects.length : 0);

    return { success: true, data: Array.isArray(projects) ? projects : [] };
  } catch (error) {
    console.error("❌ fetchProjectsAPI Error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Fetch assignees for a specific project.
 * Route: GET /projects/{projectId}/assignees/
 */
export const fetchProjectAssigneesAPI = async ({ projectId, token }) => {
  try {
    if (!projectId) throw new Error("projectId is required");

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${PROJECTS_BASE_URL}projects/${projectId}/assignees/`;
    console.log("📡 Fetching assignees:", url);

    const response = await fetch(url, { method: "GET", headers });
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response (assignees):", text.slice(0, 200));
      throw new Error("Server did not return JSON for assignees.");
    }

    const data = await response.json();
    const list = Array.isArray(data)
      ? data
      : data.assignees || data.data || data.results || data.users || [];

    console.log("✅ Assignees fetched:", Array.isArray(list) ? list.length : 0);
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (error) {
    console.error("❌ fetchProjectAssigneesAPI Error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Delete a specific project by ID.
 * Route: DELETE /projects/delete/{projectId}/
 */
export const deleteProjectApi = async (projectId) => {
  try {
    if (!projectId) throw new Error("Project ID is required for deletion.");

    let token = (await AsyncStorage.getItem("userToken")) || null;
    if (!token) {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      const parsed = userInfoString ? JSON.parse(userInfoString) : null;
      token = parsed?.token || null;
    }

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = `${DELETE_BASE_URL}projects/delete/${projectId}/`;
    console.log("🛰️ Deleting project at:", url);

    const response = await axios.delete(url, {
      headers,
      validateStatus: () => true,
    });

    console.log("🧾 Delete response:", response.status, response.data);

    if (response.status === 200 || response.status === 204) {
      return { success: true, message: "Project deleted successfully." };
    }

    if (typeof response.data === "string" && response.data.startsWith("<")) {
      return {
        success: false,
        message: "Server did not return valid JSON. Check the API endpoint.",
      };
    }

    return {
      success: false,
      message:
        response.data?.message ||
        `Failed to delete project (HTTP ${response.status}).`,
      details: response.data,
    };
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Unknown error deleting project.",
    };
  }
};

/**
 * Fetch projects and their assignees for the logged-in user.
 * Combines fetchProjectsAPI and fetchProjectAssigneesAPI.
 */
export const fetchUserProjectsWithAssignees = async () => {
  try {
    // Get user data from AsyncStorage
    const userInfoString = await AsyncStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    if (!userInfo?.user_id || !userInfo?.token) {
      throw new Error("User not logged in or missing credentials.");
    }

    const { user_id: userId, token, organization_id: orgId } = userInfo;

    // Fetch projects for the user
    const projectResult = await fetchProjectsAPI({ token, userId, orgId });
    if (!projectResult.success) {
      throw new Error(projectResult.message || "Failed to fetch projects.");
    }

    // Fetch assignees for each project
    const projectsWithAssignees = await Promise.all(
      projectResult.data.map(async (project) => {
        const projectId = project.project_id || project.id;
        const assigneeResult = await fetchProjectAssigneesAPI({ projectId, token });
        const assignees = assigneeResult.success ? assigneeResult.data : [];
        const assigneeCount = assignees.length;
        const abbreviatedNames = assignees.map((a) =>
          buildDisplayName(a).slice(0, 2).toUpperCase()
        );
        return {
          ...project,
          assigneeCount,
          abbreviatedNames,
        };
      })
    );

    return { success: true, data: projectsWithAssignees };
  } catch (error) {
    console.error("❌ fetchUserProjectsWithAssignees Error:", error.message);
    return { success: false, message: error.message };
  }
};

// Utility to build display name (reused from CardDetailsList)
export const buildDisplayName = (a) => {
  if (!a) return "User";
  const full = a.full_name || a.name;
  if (full && typeof full === "string") return full;
  const uname = a.user_name || a.username || a.user || "";
  if (uname) {
    const cleaned = uname.replace(/[._-]+/g, " ").trim();
    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }
  const email = a.user_primary_email_id || a.email || "";
  if (email && typeof email === "string") {
    const local = email.split("@")[0] || "";
    const cleaned = local.replace(/[._-]+/g, " ").trim();
    if (cleaned)
      return cleaned
        .split(" ")
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
  }
  const uid = a.user_id || a.id || "User";
  return String(uid).slice(0, 12);
};