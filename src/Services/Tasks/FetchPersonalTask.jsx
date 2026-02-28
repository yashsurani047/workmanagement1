// src/Services/FetchPersonalTask.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://taboodi.com/api/";

// ---------------------------------------------
// ✅ Helper: Get IDs and Token from AsyncStorage
// ---------------------------------------------
const getAuthContext = async () => {
  let organizationId = (await AsyncStorage.getItem("organization_id")) || "one";
  let user_id = await AsyncStorage.getItem("user_id");
  let token = await AsyncStorage.getItem("token");

  if (!user_id || !token) {
    const userInfoString = await AsyncStorage.getItem("userInfo");
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    user_id = user_id || userInfo?.user_id || userInfo?.id || userInfo?.userId || null;
    token = token || userInfo?.token || null;
  }

  return { organizationId, user_id, token };
};

// -----------------------------
// ✅ Update Personal Task (JSON body)
// -----------------------------
export const updatePersonalTask = async (organizationId, taskId, updatedData) => {
  try {
    const { token, user_id } = await getAuthContext();
    const formData = new FormData();

    formData.append("organization_id", organizationId);
    formData.append("title", updatedData.title || "");
    formData.append("description", updatedData.description || "");
    formData.append("priority", updatedData.priority || "not_urgent_not_important");
    formData.append("status", updatedData.status || "pending");
    formData.append("all_day", updatedData.all_day ? "1" : "0");
    formData.append("start_date", updatedData.start_date || "");
    formData.append("end_date", updatedData.end_date || "");
    formData.append("start_time", updatedData.all_day ? "" : (updatedData.start_time || ""));
    formData.append("end_time", updatedData.all_day ? "" : (updatedData.end_time || ""));
    formData.append("recurrence", updatedData.recurrence || "none");
    formData.append("recurrence_days", updatedData.recurrence_days || "");
    formData.append("recurrence_end_date", updatedData.recurrence_end_date || "");
    formData.append("updated_by", user_id || "");

    if (updatedData.links && Array.isArray(updatedData.links)) {
      formData.append("links", JSON.stringify(updatedData.links));
    }

    if (updatedData.attachments && Array.isArray(updatedData.attachments)) {
      updatedData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/${taskId}/update/`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const raw = await response.text();
    let result = null;
    try {
      if (raw && raw.trim().length > 0) result = JSON.parse(raw);
    } catch (_) {
    }

    if (!response.ok) {
      const msg = result?.error || result?.message || raw || `Failed to update task (HTTP ${response.status})`;
      return { success: false, error: msg };
    }

    const task = result?.task || result?.data || result || null;
    return { success: true, task, message: 'Task updated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// -----------------------------
// ✅ Fetch All Personal Tasks
// -----------------------------
export const fetchPersonalTasks = async () => {
  try {
    const { organizationId, user_id } = await getAuthContext();

    if (!user_id) {
      return {
        tasks: [],
        taskStats: {
          total: 0,
          completed: 0,
          in_progress: 0,
          not_started: 0,
          rejected: 0,
          pending: 0,
          cancelled: 0,
          on_hold: 0,
          archived: 0,
        },
      };
    }

    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/list/?user_id=${user_id}`;
    const response = await fetch(url);
    const raw = await response.text();
    let data = null;
    try {
      if (raw && raw.trim().length > 0) data = JSON.parse(raw);
    } catch (_) {
      data = null;
    }

    const orgTasks = Array.isArray(data?.tasks) ? data.tasks : [];

    const statuses = [
      "completed",
      "in_progress",
      "not_started",
      "rejected",
      "pending",
      "cancelled",
      "on_hold",
      "archived",
    ];

    const taskStats = statuses.reduce((acc, s) => {
      acc[s] = orgTasks.filter(
        (t) => (t.status || "").toLowerCase() === s
      ).length;
      return acc;
    }, { total: orgTasks.length });

    return { tasks: orgTasks, taskStats };
  } catch (error) {
    console.error("Error fetching personal tasks:", error);
    return { tasks: [], taskStats: { total: 0 } };
  }
};

// -----------------------------
// ✅ Create Personal Task
// -----------------------------
export const createTask = async (organizationId, payload) => {
  try {
    const { token } = await getAuthContext();
    const formData = new FormData();

    formData.append("organization_id", organizationId);
    formData.append("title", payload.title);
    formData.append("description", payload.description || "");
    formData.append("priority", payload.priority || "not_urgent_not_important");
    formData.append("start_date", payload.start_date || "");
    formData.append("end_date", payload.end_date || "");
    formData.append("all_day", payload.all_day ? "1" : "0");
    formData.append("start_time", payload.all_day ? "" : (payload.start_time || ""));
    formData.append("end_time", payload.all_day ? "" : (payload.end_time || ""));
    formData.append("recurrence", payload.recurrence || "none");
    formData.append("recurrence_end_date", payload.recurrence_end_date || "");
    formData.append("recurrence_interval", String(payload.recurrence_interval ?? 1));
    formData.append("recurrence_days", payload.recurrence_days || "");
    formData.append("created_by", payload.created_by || "");
    formData.append("creator_user_id", payload.creator_user_id || "");
    formData.append("status", payload.status || "pending");

    if (payload.links && Array.isArray(payload.links)) {
      formData.append("links", JSON.stringify(payload.links));
    }

    if (payload.attachments && Array.isArray(payload.attachments)) {
      payload.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/create/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const raw = await response.text();
    let responseData = null;
    try {
      if (raw && raw.trim().length > 0) responseData = JSON.parse(raw);
    } catch (_) {
      responseData = null;
    }

    if (!response.ok) {
      console.error("createTask error", { status: response.status, raw });
      const message = responseData?.message || responseData?.error || raw || "Failed to create task";
      return { success: false, error: message };
    }

    const created = responseData?.task || (Array.isArray(responseData?.tasks) ? responseData.tasks[0] : null) || responseData?.data || null;
    return { success: true, task: created };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, error: error.message };
  }
};

// -----------------------------
// ✅ Update Personal Task
// -----------------------------
export const updateTask = async (organizationId, taskId, taskData) => {
  try {
    const { token, user_id } = await getAuthContext();
    const formData = new FormData();

    formData.append("title", taskData.title || "");
    formData.append("description", taskData.description || "");
    formData.append("priority", taskData.priority || "urgent_important");
    formData.append("status", taskData.status || "pending");
    formData.append("all_day", taskData.all_day ? "1" : "0");
    formData.append("remarks", taskData.remarks || "");
    formData.append("organization_id", organizationId);
    formData.append("task_id", taskId);
    formData.append("updated_by", user_id || "");

    if (taskData.tags) formData.append("tags", JSON.stringify(taskData.tags));
    if (Array.isArray(taskData.attachments)) {
      taskData.attachments.forEach((attachment) => {
        if (attachment?.file) formData.append("attachments", attachment.file);
      });
    }

    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/${taskId}/update/`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    // Read raw text first to handle 204/empty or non-JSON responses safely
    const raw = await response.text();
    let result = null;
    try {
      if (raw && raw.trim().length > 0) result = JSON.parse(raw);
    } catch (_) {
      // leave result as null; we'll fall back to raw text in error message
    }

    if (!response.ok) {
      const message =
        result?.message ||
        result?.error ||
        raw ||
        "Failed to update task";
      return { success: false, error: message };
    }

    const updated = result?.task || result?.data || result;
    return updated
      ? { success: true, task: updated }
      : { success: true, task: null }; // treat empty success as ok without payload
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: error.message };
  }
};

// -----------------------------
// ✅ Delete Personal Task
// -----------------------------
export const deletePersonalTask = async (organizationId, taskId) => {
  try {
    const { token } = await getAuthContext();
    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/${taskId}/delete/`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const raw = await response.text();
    let result = null;
    try {
      if (raw && raw.trim().length > 0) result = JSON.parse(raw);
    } catch (_) {
      result = null;
    }

    if (!response.ok) {
      return { success: false, error: result?.message || result?.error || raw || "Failed to delete task" };
    }

    // Many APIs return 204 with no content for delete; treat any ok as success
    return result || { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: error.message };
  }
};
