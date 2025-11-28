const API_BASE_URL = "http://127.0.0.1:8000/api/";

// Utils/Tasks/taskApi.js
export const getSprintTasks = async (orgId, projectId, filters = {}) => {
  let url = `${API_BASE_URL}sprint-tasks/organizations/${orgId}/list/?project_id=${projectId}`;

  if (filters.status && filters.status !== 'all') {
      url += `&status=${filters.status}`;
  }
  if (filters.searchQuery) {
      url += `&search=${encodeURIComponent(filters.searchQuery)}`;
  }
  if (filters.sortBy) {
      url += `&ordering=${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`;
  }

  const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// utils/api.js

// ✅ Check availability for a user
export const checkTaskAvailability = async (orgId, userId) => {
  const url = `${API_BASE_URL}tasks/check-availability/${orgId}/${userId}/`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// Utils/Tasks/taskApi.js

export const createSprintTask = async (organizationId, taskData) => {
  const formData = new FormData();

  // Ensure numeric/boolean fields are valid
  const payload = {
    ...taskData,
    created_by: sessionStorage.getItem('username'),
    creator_user_id: sessionStorage.getItem('user_id'),
    tags: JSON.stringify(taskData.tags || []),
    assigned_to: JSON.stringify(taskData.assigned_to || []),
    all_day: taskData.all_day ? 'true' : 'false',
    project_id: taskData.project_id || null, // avoid empty string for INT
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  // Append attachments
  taskData.attachments.forEach((attachment, index) => {
    formData.append(`attachment_${index}`, attachment.file);
  });

  const response = await fetch(
    `${API_BASE_URL}sprint-tasks/organizations/${organizationId}/`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const takeTask = async ({ sprintTaskId, userId, notes, dueDate, estimatedTime, allDay }) => {
  const formatTime = (time) => {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length === 2) return `${time}:00`;
    return time;
  };

  const organization_id = sessionStorage.getItem('organization_id');

  const body = {
    user_id: userId,
    notes: notes,
    due_date: dueDate,
    estimated_time: allDay ? null : formatTime(estimatedTime),
    all_day: allDay
  };
  try {
    const response = await fetch(
      `${API_BASE_URL}sprint-tasks/organizations/${organization_id}/${sprintTaskId}/take/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error || 'Failed to take task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in takeTask util:', error);
    throw error;
  }
};