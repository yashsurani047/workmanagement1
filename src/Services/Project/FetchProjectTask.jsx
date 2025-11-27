// src/Services/Project/FetchProjectTask.jsx
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "../../Utils/apiUtils";

// Create a new task with optional attachments
// Create Task
export const createTask = async (taskData) => {
  try {
    const rawUser = await AsyncStorage.getItem('userInfo');
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (!user?.user_id || !user?.organization_id) {
      throw new Error('User ID or organization ID missing');
    }

    const formData = new FormData();

    const fields = {
      project_id: taskData.project_id || '',
      project_name: taskData.project_name || '',
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      assigned_to: JSON.stringify(taskData.assigned_to || []),
      due_date: taskData.due_date || '',
      start_time: taskData.start_time || '',
      end_time: taskData.end_time || '',
      all_day: taskData.all_day ? '1' : '0',
      tags: JSON.stringify(taskData.tags || []),
      remarks: taskData.remarks || '',
      created_by: user.full_name || '',
      creator_user_id: user.user_id || '',
      organization_id: user.organization_id,
    };

    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));

    // Handle attachments if any
    if (Array.isArray(taskData.attachments)) {
      taskData.attachments.forEach((attachment, index) => {
        if (attachment?.file) {
          formData.append(`attachments[${index}]`, {
            uri: attachment.file.uri,
            type: attachment.file.type || 'image/jpeg',
            name: attachment.file.name || `attachment-${Date.now()}.jpg`,
          });
        }
      });
    }

    const url = `${API_BASE_URL}organizations/${user.organization_id}/create-task/`;
    const response = await fetch(url, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } 
    catch { throw new Error(`Server returned non-JSON response:\n${text}`); }

    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create task');

    return data;
  } catch (error) {
    console.error('CREATE TASK ERROR:', error);
    return { success: false, error: error.message };
  }
};


// Fetch tasks for a project within an organization (axios-based, normalized array)
export const fetchTasksByProject = async (orgId, projectId) => {
  if (!orgId || !projectId) return [];
  try {
    const res = await axios.get(`${API_BASE_URL}organizations/${orgId}/tasks/?project_id=${projectId}&_=${Date.now()}`);
    const data = res?.data;
    // Normalize: API returns { tasks: { status, tasks: [...] } } OR { tasks: [...] }
    const list = data?.tasks?.tasks || data?.tasks || [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error fetching tasks:", error?.message || error);
    return [];
  }
};

// Forward a task from one user to another
export const forwardTask = async (forwardData) => { 
  try {
    const response = await fetch(`${API_BASE_URL}task/forward/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: forwardData.task_id,
        from_user: forwardData.from_user,
        to_user: forwardData.to_user,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error forwarding task:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update task status for a specific task in an org
export const updateTaskStatus = async (orgId, taskId, payload) => {
  if (!orgId || !taskId) throw new Error("Missing organization or task id");
  const url = `${API_BASE_URL}tasks/update-status/${orgId}/${taskId}/`;
  try {
    // Pull token similar to other services
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
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

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('[updateTaskStatus] URL:', url);
    console.log('[updateTaskStatus] Payload:', payload);
    console.log('[updateTaskStatus] Headers:', { hasAuth: !!token, 'Content-Type': headers['Content-Type'] });

    const body = (async () => {
      const p = payload || {};
      if (!p || typeof p !== 'object') return p;
      // required fields
      const status = p.status;
      // derive updated_by from AsyncStorage
      let updatedBy =
        (await AsyncStorage.getItem('user_id')) ||
        (await AsyncStorage.getItem('userId')) ||
        (() => {
          try {
            const raw = JSON.parse(p?.updated_by || 'null');
            return raw || '';
          } catch { return p?.updated_by || ''; }
        })();
      if (!updatedBy) {
        try {
          const raw = await AsyncStorage.getItem('userInfo');
          const parsed = raw ? JSON.parse(raw) : null;
          updatedBy = parsed?.user_id ? String(parsed.user_id) : '';
        } catch {}
      }
      const notes = p.notes || p.remarks || '';

      const enriched = {
        ...p,
        ...(status ? { task_status: status, new_status: status, status_value: status } : {}),
        ...(updatedBy ? { updated_by: String(updatedBy) } : {}),
        ...(notes ? { notes } : {}),
      };
      return enriched;
    })();
    const res = await axios.patch(url, await body, { headers });
    console.log('[updateTaskStatus] Response status:', res?.status);
    if (res?.data) console.log('[updateTaskStatus] Response data:', res.data);
    return res?.data;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message || data?.error || err?.message || 'Failed to update task status';
    throw new Error(`${message}${status ? ` (HTTP ${status})` : ''}`);
  }
};  

// Fetch task update logs for a specific task within an organization
export const getTaskUpdateLogs = async (orgId, taskId) => {
  const response = await fetch(
    `${API_BASE_URL}tasks/organizations/${orgId}/task-updates-log/${taskId}/`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// Share/collaborate a task with a user
export const shareTask = async (taskData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}task/share-collaborate/`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskData.task_id,
        user_id: taskData.user_id,
        action: 'share',
        sent_by_user_id: taskData.sent_by_user_id
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to share task');
    }

    return data;
  } catch (error) {
    console.error('Error in shareTask:', error);
    throw error;
  }
};

// Collaborate on a task with a user
export const collaborateTask = async (taskData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}task/share-collaborate/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskData.task_id,
          user_id: taskData.user_id,
          action: 'collaborate',
          sent_by_user_id: taskData.sent_by_user_id
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add collaborator');
    }

    return data;
  } catch (error) {
    console.error('Error in collaborateTask:', error);
    throw error;
  }
};

// Backwards-compatible named export that returns the same normalized array
export const fetchProjectTasks = fetchTasksByProject;

// Default export for convenience
export default fetchTasksByProject;
