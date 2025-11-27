// src/Services/FetchProjectAssignee.jsx
export const API_BASE_URL = 'https://taboodi.com/api/';

export const fetchProjectAssignees = async (projectId) => {
  if (!projectId) throw new Error('projectId is required');
  const response = await fetch(`${API_BASE_URL}projects/${projectId}/assignees/`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};
