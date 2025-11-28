import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000/api/'; // Base URL for backend

export const getProjectsByUser = async (organizationId, userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}projects/organization/${organizationId}/user/${userId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

export const getProjectsByCreator = async (organizationId, userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}projects/organization/${organizationId}/creator/${userId}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// src/utils/api.js
export async function fetchProjectTaskLogs(projectId) {
  try {
    const response = await fetch(`${API_BASE_URL}get-project-logs/${projectId}/`);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    return data.status === "success" ? data.data : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}



// Fetch organization users
export const fetchOrganizationUsers = async (organizationId) => {
  try {
    const res = await fetch(`${API_BASE_URL}users/?organization_id=${organizationId}`);
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return { success: true, users: data.users || [], raw: data };
  } catch (err) {
    console.error('Error fetching users:', err);
    return { success: false, users: [], error: err.message };
  }
};



// Fetch users for the organization
export const fetchUsers = async (organizationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}get-username/${organizationId}/`);
    const data = await response.json();
    if (data.status) {
      return { success: true, users: data.users };
    }
    return { success: false, error: data.error || 'Failed to fetch users' };
  } catch (error) {
    return { success: false, error: error.message || 'Error fetching users' };
  }
};

// Utils/Projects/ProjectTaskApi.js
export async function addProjectAssignees(projectId, userIds, assignedBy) {
  console.log("🚀 addProjectAssignees called with:", { projectId, userIds, assignedBy });

  try {
    const url = `${API_BASE_URL}projects/${projectId}/assignees/`;
    console.log("🌍 Fetch URL:", url);

    const bodyData = { user_ids: userIds, assigned_by: assignedBy };
    console.log("📦 Request Body:", bodyData);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    console.log("📡 Raw Response:", response);

    if (!response.ok) {
      const text = await response.text(); // catch Django HTML error pages
      console.error("❌ Response not OK:", text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log("✅ Response JSON:", data);

    return { success: true, data };
  } catch (error) {
    console.error("🚨 Error in addProjectAssignees:", error);
    return { success: false, error: error.message };
  }
}



// ✅ Remove an assignee from a project
export async function removeProjectAssignee(projectId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}projects/${projectId}/assignees/remove/${userId}/`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Create or update project
export const saveProject = async (projectData, isEditing = false) => {
  try {
    const formPayload = new FormData();

    Object.keys(projectData).forEach((key) => {
      if (key === 'assignees' || key === 'links') {
        formPayload.append(key, JSON.stringify(projectData[key] || []));
      } else if (key === 'documents' && Array.isArray(projectData[key])) {
        projectData[key].forEach(file => formPayload.append('documents', file));
      } else {
        formPayload.append(key, projectData[key] || '');
      }
    });

    const url = isEditing
      ? `${API_BASE_URL}projects/update/`
      : `${API_BASE_URL}projects/create/`;

    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, { method, body: formPayload });

    if (!response.ok) {
      let errorMsg = isEditing ? 'Failed to update project' : 'Failed to create project';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        if (errorData.missing_fields) {
          errorMsg += ` (Missing: ${errorData.missing_fields.join(', ')})`;
        }
      } catch (e) {
        errorMsg = await response.text();
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return { success: data.success, data, message: data.message };
  } catch (err) {
    return { success: false, message: err.message || 'An error occurred', error: err };
  }
};

export const shareProject = async (projectId, sharedByUserId, sharedWithUserName, permissionType = "view") => {
  try {
    const response = await fetch(`${API_BASE_URL}projects/share/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        shared_by_user_id: sharedByUserId,
        shared_with_user_name: sharedWithUserName,
        permission_type: permissionType,
      }),
    });

    const data = await response.json();
    if (data.success) {
      return { success: true, message: data.message || "Project shared successfully!" };
    } else {
      return { success: false, message: data.message || "Failed to share project." };
    }
  } catch (error) {
    return { success: false, message: error.message || "Something went wrong." };
  }
};