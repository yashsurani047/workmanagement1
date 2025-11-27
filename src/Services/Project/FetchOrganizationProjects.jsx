// src/Services/FetchOrganizationProjects.jsx
export const API_BASE_URL = 'https://taboodi.com/api/';

export const fetchOrganizationProjects = async (organizationId = 'one') => {
  const response = await fetch(`${API_BASE_URL}projects/organization/${organizationId}/`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  const projects = Array.isArray(data?.projects) ? data.projects : (Array.isArray(data) ? data : []);
  const flat = projects.map((p) => (p && p.project ? p.project : p));
  // Normalize minimal shape for UI usage
  return flat.map((p, idx) => {
    const id = p?.project_id || p?.id || p?._id || String(idx);
    const name = p?.name || p?.title || p?.project_name || p?.project_title || `Project ${id}`;
    return { id: String(id), name: String(name) };
  });
};

// Original-style fetch returning { success, projects }
export const fetchProjects = async (organizationId = 'one') => {
  try {
    const response = await fetch(`${API_BASE_URL}projects/organization/${organizationId}/`);
    const data = await response.json();
    if (data?.success || String(data?.status || '').toLowerCase() === 'success') {
      const projects = Array.isArray(data?.projects) ? data.projects : (Array.isArray(data) ? data : []);
      const flat = projects.map((p) => (p && p.project ? p.project : p));
      return { success: true, projects: flat };
    }
    return { success: false, error: data?.error || data?.message || 'Failed to fetch projects' };
  } catch (error) {
    return { success: false, error: error?.message || 'Error fetching projects' };
  }
};
