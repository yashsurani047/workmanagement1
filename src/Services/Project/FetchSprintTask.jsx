// src/Services/Project/FetchSprintTask.jsx
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../../Config/api";

const API_BASE_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

// Fetch sprint tasks for a project within an organization
// Example: https://taboodi.com/api/sprint-tasks/organizations/{orgId}/list/?project_id={projectId}
export const getSprintTasks = async (orgId, projectId, filters = {}) => {
  if (!orgId || !projectId) return [];

  let url = `${API_BASE_URL}sprint-tasks/organizations/${orgId}/list/?project_id=${projectId}`;

  if (filters.status && filters.status !== "all") url += `&status=${filters.status}`;
  if (filters.searchQuery) url += `&search=${encodeURIComponent(filters.searchQuery)}`;
  if (filters.sortBy) url += `&ordering=${filters.sortOrder === "desc" ? "-" : ""}${filters.sortBy}`;

  try {
    const res = await axios.get(url);
    const data = res?.data;
    // Normalize common API patterns
    const list = data?.tasks?.tasks || data?.tasks || data?.data || data || [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error fetching sprint tasks:", error?.message || error);
    return [];
  }
};

// Create a new sprint task
// taskData shape should include at minimum: { project_id, title, description, tags, attachments, remarks }
export const createSprintTask = async (organizationId, taskData = {}) => {
  if (!organizationId) throw new Error('organizationId is required');

  const formData = new FormData();

  // Best-effort enrichment from local storage (React Native)
  let created_by = undefined;
  let creator_user_id = undefined;
  let authToken = undefined;
  try {
    created_by = await AsyncStorage.getItem('username');
    creator_user_id = await AsyncStorage.getItem('user_id');
    const userInfoRaw = await AsyncStorage.getItem('userInfo');
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
    if (!created_by && userInfo?.username) created_by = userInfo.username;
    if (!creator_user_id && userInfo?.user_id) creator_user_id = String(userInfo.user_id);
    authToken = await AsyncStorage.getItem('userToken');
  } catch (_) {}

  const payload = {
    ...taskData,
    sprint_task_id: taskData.sprint_task_id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    project_name: taskData.project_name || '',
    created_by: created_by || taskData.created_by,
    creator_user_id: creator_user_id || taskData.creator_user_id,
    priority: taskData.priority || 'not_urgent_not_important',
    status: taskData.status || 'untaken',
    tags: JSON.stringify(taskData.tags || []),
    assigned_to: JSON.stringify(taskData.assigned_to || []),
    all_day: taskData.all_day ? 1 : 0,
    project_id: Number(taskData.project_id) || null,
    remarks: taskData.remarks || '',
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  // Append attachments (React Native style: { uri, name, type })
  const files = Array.isArray(taskData.attachments) ? taskData.attachments : [];
  if (files.length) {
    files.forEach((attachment, index) => {
      const filePart = {
        uri: attachment.uri,
        name: attachment.name || `file_${index}`,
        type: attachment.type || 'application/octet-stream',
      };
      const id = attachment.id || `att_${Date.now()}_${index}`;
      // Repeat same field names for arrays as many backends expect
      formData.append('attachment_id', id);
      if (filePart.uri) formData.append('attachment', filePart);
    });
  }

  const url = `${API_BASE_URL}sprint-tasks/organizations/${organizationId}/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    let bodyText = '';
    try { bodyText = await response.text(); } catch (_) {}
    console.log('createSprintTask error body:', bodyText);
    // Try to extract a meaningful message
    let message = `HTTP error! status: ${response.status}`;
    try {
      const parsed = JSON.parse(bodyText);
      message = parsed?.error || parsed?.detail || JSON.stringify(parsed);
    } catch (_) {
      if (bodyText) message = bodyText;
    }
    throw new Error(message);
  }

  return await response.json();
};

// Take/assign a sprint task to a user
// Example endpoint: POST /sprint-tasks/organizations/{orgId}/{sprintTaskId}/take/
// body: { user_id, notes, due_date, estimated_time, all_day }
export const takeSprintTask = async (
  organizationId,
  { sprintTaskId, userId, notes, dueDate, estimatedTime, allDay }
) => {
  if (!organizationId) throw new Error('organizationId is required');
  if (!sprintTaskId) throw new Error('sprintTaskId is required');
  if (!userId) {
    // Best-effort read from storage if not provided
    try {
      const stored = await AsyncStorage.getItem('user_id');
      if (!stored) throw new Error('userId is required');
    } catch (_) {
      throw new Error('userId is required');
    }
  }

  const formatTime = (time) => {
    if (!time) return null;
    const parts = String(time).split(':');
    if (parts.length === 2) return `${time}:00`;
    return time;
  };

  const body = {
    user_id: userId,
    notes: notes,
    due_date: dueDate,
    estimated_time: allDay ? null : formatTime(estimatedTime),
    all_day: !!allDay,
  };

  const url = `${API_BASE_URL}sprint-tasks/organizations/${organizationId}/${sprintTaskId}/take/`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `HTTP error ${res.status}`;
    try {
      const data = await res.json();
      message = data?.error || data?.detail || message;
    } catch (_) {}
    throw new Error(message);
  }

  return await res.json();
};

export default getSprintTasks;
