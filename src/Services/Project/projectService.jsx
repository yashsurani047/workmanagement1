// Services/projectService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const BASE_URL = "https://taboodi.com/api";

// Helper for requests (adds Authorization header automatically if token present)
const handleRequest = async (url, options = {}, errorTag = "API") => {
  try {
    let headers = { ...(options.headers || {}) };
    try {
      const token = (await AsyncStorage.getItem("userToken")) || (await AsyncStorage.getItem("token"));
      if (!headers.Authorization && token) headers.Authorization = `Bearer ${token}`;
    } catch {}

    const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`[${errorTag}]`, error.message);
    return { success: false, error: error.message };
  }
};

// Convert object to FormData
const toFormData = (obj) => {
  const formData = new FormData();
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, i) => {
        formData.append("documents", {
          uri: file.uri,
          type: file.type || "application/octet-stream",
          name: file.name || `document_${i}`,
        });
      });
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });
  return formData;
};

// ✅ CRUD API Functions

export const getProjectsByOrganization = async (organizationId) =>
  handleRequest(`/projects/organization/${organizationId}/`, {}, "getProjectsByOrganization");

export const getProjectsByUser = async (organizationId, userId) =>
  handleRequest(
    `/projects/organization/${organizationId}/user/${userId}/`,
    {},
    "getProjectsByUser"
  );

export const getProjectsByCreator = async (organizationId, userId) =>
  handleRequest(
    `/projects/organization/${organizationId}/creator/${userId}/`,
    {},
    "getProjectsByCreator"
  );

export const getProjectDetails = async (projectId) =>
  handleRequest(`/projects/${projectId}/`, {}, "getProjectDetails");

export const createProject = async (projectData) => {
  const formData = toFormData(projectData);
  return handleRequest("/projects/create/", {
    method: "POST",
    body: formData,
  }, "createProject");
};

export const updateProject = async (projectId, projectData) => {
  const formData = toFormData({ ...projectData, project_id: projectId });
  // Prefer id-scoped update endpoint; many backends require it
  return handleRequest(`/projects/${projectId}/update/`, {
    method: "PUT",
    body: formData,
  }, "updateProject");
};

// Axios-based JSON update API (preferred if backend expects JSON)
export const updateProjectApi = async (projectId, updatedData) => {
  try {
    // Try to attach Authorization if available
    let headers = { "Content-Type": "application/json" };
    try {
      const token = (await AsyncStorage.getItem("userToken")) || (await AsyncStorage.getItem("token"));
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {}

    const response = await axios.put(
      `${BASE_URL}/projects/${projectId}/update/`,
      updatedData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, message: error?.response?.data?.message || error.message };
  }
};

export const deleteProject = async (projectId) =>
  handleRequest(`/projects/delete/${projectId}/`, { method: "DELETE" }, "deleteProject");

export const addProjectAssignees = async (projectId, userIds, assignedBy) => {
  // assignedBy here is the current user's user_id
  let assignedByName = null;
  try {
    const raw = await AsyncStorage.getItem("userInfo");
    const info = raw ? JSON.parse(raw) : null;
    assignedByName = info?.username || info?.user_name || null;
  } catch {}

  const body = {
    user_ids: userIds,
    assigned_by_user_id: assignedBy,
  };
  if (assignedByName) body.assigned_by = assignedByName;

  return handleRequest(
    `/projects/${projectId}/assignees/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "addProjectAssignees"
  );
};

export const removeProjectAssignee = async (projectId, userId) =>
  handleRequest(
    `/projects/${projectId}/assignees/remove/${userId}/`,
    { method: "DELETE" },
    "removeProjectAssignee"
  );

export const addProjectDocument = async (projectId, file, uploadedBy) => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    type: file.type || "application/octet-stream",
    name: file.name || "document",
  });
  formData.append("uploaded_by", uploadedBy);

  return handleRequest(`/projects/${projectId}/documents/`, {
    method: "POST",
    body: formData,
  }, "addProjectDocument");
};

export const addProjectLink = async (projectId, linkTitle, linkUrl, addedBy) =>
  handleRequest(`/projects/${projectId}/links/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      link_title: linkTitle,
      link_url: linkUrl,
      added_by: addedBy,
    }),
  }, "addProjectLink");

export const fetchOrganizationUsers = async (organizationId) => {
  try {
    const token = (await AsyncStorage.getItem("userToken")) || null;
    const userInfoString = await AsyncStorage.getItem("userInfo");
    const parsed = userInfoString ? JSON.parse(userInfoString) : null;
    const authToken = token || parsed?.token || null;
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    return await handleRequest(
      `/users/?organization_id=${organizationId}`,
      { headers },
      "fetchOrganizationUsers"
    );
  } catch (e) {
    return { success: false, error: e?.message || "Unknown error" };
  }
};

export const fetchProjectTaskLogs = async (projectId) =>
  handleRequest(`/get-project-logs/${projectId}/`, {}, "fetchProjectTaskLogs");

export default {
  getProjectsByOrganization,
  getProjectsByUser,
  getProjectsByCreator,
  getProjectDetails,
  createProject,
  updateProject,
  deleteProject,
  addProjectAssignees,
  removeProjectAssignee,
  addProjectDocument,
  addProjectLink,
  fetchOrganizationUsers,
  fetchProjectTaskLogs,
};
