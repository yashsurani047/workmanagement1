/* eslint-disable no-undef */
// src/utils/apiUtils.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ================================
// 🌍 Base API Configuration
// ================================
export const API_BASE_URL = "https://taboodi.com/api/"; // aligned with other successful calls

// Axios instance (optional for interceptors, auth, etc.)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ================================
// 👥 User & Organization APIs
// ================================
export const getUsers = async (orgId) => {
  try {
    const PROD_BASE = "https://taboodi.com/api/";
    const res = await fetch(`${PROD_BASE}get-username/${orgId}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching users:", err);
    return { success: false, error: err.message };
  }
};

export const fetchOrganizationUsers = async (organizationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}users/?organization_id=${organizationId}`);
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    return { success: true, users: data.users || [] };
  } catch (err) {
    console.error("Error fetching org users:", err);
    return { success: false, error: err.message };
  }
};

// ================================
// 🧱 Project APIs
// ================================
export const fetchProjects = async (organizationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}projects/organization/${organizationId}/`);
    const data = await res.json();
    if (data.success) return { success: true, projects: data.projects };
    return { success: false, error: data.error || "Failed to fetch projects" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const getProjectsByUser = async (organizationId, userId) => {
  try {
    const res = await api.get(`projects/organization/${organizationId}/user/${userId}/`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: err.message };
  }
};

export const getProjectsByCreator = async (organizationId, userId) => {
  try {
    const res = await api.get(`projects/organization/${organizationId}/creator/${userId}/`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: err.message };
  }
};

export const getProjectDetails = async (projectId) => {
  const res = await fetch(`${API_BASE_URL}projects/${projectId}/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
};


export const updateProjectApi = async (projectId, updatedData) => {
  try {
    const res = await api.put(`projects/${projectId}/update/`, updatedData);
    return res.data;
  } catch (err) {
    console.error("Error updating project:", err);
    return { success: false, message: err.message };
  }
};

export const deleteProjectApi = async (projectId) => {
  try {
    const res = await api.delete(`projects/delete/${projectId}/`);
    return res.data;
  } catch (err) {
    console.error("Error deleting project:", err);
    return { success: false, message: err.message };
  }
};

// ================================
// 👤 Assignees APIs
// ================================
export async function addProjectAssignees(projectId, userIds, assignedBy) {
  try {
    const url = `${API_BASE_URL}projects/${projectId}/assignees/`;
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await (async () => {
        try {
          const raw = await AsyncStorage.getItem("userInfo");
          const parsed = raw ? JSON.parse(raw) : null;
          return parsed?.token || null;
        } catch {
          return null;
        }
      })());

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const bodyData = { user_ids: userIds, assigned_by: assignedBy };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("Error adding assignees:", err);
    return { success: false, error: err.message };
  }
}

// Organization-level assign users API
export const assignUsersToProject = async (orgId, payload) => {
  const token =
    (await AsyncStorage.getItem("userToken")) ||
    (await AsyncStorage.getItem("token")) ||
    (await (async () => {
      try {
        const raw = await AsyncStorage.getItem("userInfo");
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.token || null;
      } catch {
        return null;
      }
    })());

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}organizations/${orgId}/assign-users/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// Token-aware fetch assignees
export const fetchProjectAssignees = async (projectId) => {
  const token =
    (await AsyncStorage.getItem("userToken")) ||
    (await AsyncStorage.getItem("token")) ||
    (await (async () => {
      try {
        const raw = await AsyncStorage.getItem("userInfo");
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed?.token || null;
      } catch {
        return null;
      }
    })());

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}projects/${projectId}/assignees/`, { headers });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export async function removeProjectAssignee(projectId, userId) {
  try {
    const res = await fetch(`${API_BASE_URL}projects/${projectId}/assignees/remove/${userId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ================================
// 📁 Documents & Links
// ================================
export async function addProjectDocument(projectId, file, uploadedBy) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", uploadedBy);

    const res = await fetch(`${API_BASE_URL}projects/${projectId}/documents/`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to upload file");
    return data;
  } catch (err) {
    console.error("Error uploading document:", err);
    throw err;
  }
}

export async function addProjectLink(projectId, linkTitle, linkUrl, addedBy) {
  try {
    const res = await fetch(`${API_BASE_URL}projects/${projectId}/links/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link_title: linkTitle, link_url: linkUrl, added_by: addedBy }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add link");
    return data;
  } catch (err) {
    console.error("Error adding link:", err);
    throw err;
  }
}

// ================================
// 🕒 Logs & Tasks
// ================================
export async function fetchProjectTasks(organizationId, projectId) {
  const res = await fetch(`${API_BASE_URL}organizations/${organizationId}/tasks/?project_id=${projectId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchProjectTaskLogs(projectId) {
  try {
    const res = await fetch(`${API_BASE_URL}get-project-logs/${projectId}/`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    const data = await res.json();
    return data.status === "success" ? data.data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// 📝 Task Update Logs (per task)
// getTaskUpdateLogs moved to Services/Project/FetchProjectTask.jsx

// ================================
// ⚙️ Helper Functions
// ================================
export const getSessionInfo = () => ({
  orgId: sessionStorage.getItem("organization_id") || "one",
  userId: sessionStorage.getItem("user_id") || "unknown",
});
