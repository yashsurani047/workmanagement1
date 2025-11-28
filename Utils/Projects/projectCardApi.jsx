// utils/apiUtils.js
import axios from "axios";
const API_BASE_URL = 'http://127.0.0.1:8000/api/';

// ---------------------------
// User APIs
// ---------------------------
export const getUsers = async (orgId) => {
  const response = await fetch(`${API_BASE_URL}get-username/${orgId}/`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// -----------------------------
// ✅ Fetch Projects for Organization
// -----------------------------
export const fetchProjects = async (organizationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}projects/organization/${organizationId}/`);
    const data = await response.json();
    if (data.success) {
      return { success: true, projects: data.projects };
    }
    return { success: false, error: data.error || "Failed to fetch projects" };
  } catch (error) {
    return { success: false, error: error.message || "Error fetching projects" };
  }
};

export const fetchProjectTasks = async (organizationId, projectId) => {
    const response = await fetch(`${API_BASE_URL}organizations/${organizationId}/tasks/?project_id=${projectId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
};

export const fetchProjectAssignees = async (projectId) => {
    const response = await fetch(`${API_BASE_URL}projects/${projectId}/assignees/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
};

export const assignUsersToProject = async (orgId, payload) => {
    const response = await fetch(`${API_BASE_URL}organizations/${orgId}/assign-users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
};

export const deleteProjectApi = async (projectId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}projects/delete/${projectId}/`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, message: error.message };
  }
};


export const updateProjectApi = async (projectId, updatedData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}projects/${projectId}/update/`,
      updatedData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, message: error.message };
  }
};


// ✅ Upload a file to project
export async function addProjectDocument(projectId, file, uploadedBy) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploaded_by', uploadedBy);

    const response = await fetch(`${API_BASE_URL}projects/${projectId}/documents/`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to upload file');
    return data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// ✅ Add a link to project
export async function addProjectLink(projectId, linkTitle, linkUrl, addedBy) {
  try {
    const response = await fetch(`${API_BASE_URL}projects/${projectId}/links/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_title: linkTitle, link_url: linkUrl, added_by: addedBy }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add link');
    return data;
  } catch (error) {
    console.error('Error adding link:', error);
    throw error;
  }
}

// ---------------------------
// Session info
// ---------------------------
export const getSessionInfo = () => ({
  orgId: sessionStorage.getItem("organization_id") || "one",
  userId: sessionStorage.getItem("user_id") || "unknown",
});

export const getProjectDetails = async (projectId) => {
  const response = await fetch(`${API_BASE_URL}projects/${projectId}/`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};
