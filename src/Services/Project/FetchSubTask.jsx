import { API_BASE_URL } from '../../Utils/apiUtils';

// Fetch subtasks for a specific task (real API)
export const fetchSubtasks = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}tasks/${taskId}/subtasks/list/`);
    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      throw new Error(data.message || data.error || 'Failed to fetch subtasks');
    }

    return { success: true, subtasks: data.subtasks || [] };
  } catch (err) {
    console.error('❌ fetchSubtasks error:', err);
    return { success: false, error: err.message, subtasks: [] };
  }
};

// Add or update a subtask with attachments
export const addSubtask = async (taskId, subtaskData) => {
  try {
    const formData = new FormData();

    // Add JSON fields
    formData.append('title', subtaskData.title || '');
    formData.append('description', subtaskData.description || '');
    formData.append('status', subtaskData.status || 'not_started');
    formData.append('priority', subtaskData.priority || 'urgent_important');
    formData.append('due_date', subtaskData.due_date || '');
    formData.append('is_full_day', subtaskData.is_full_day ? 1 : 0);

    if (!subtaskData.is_full_day) {
      formData.append('start_time', subtaskData.start_time || '');
      formData.append('end_time', subtaskData.end_time || '');
    }

    formData.append(
      'assigned_users',
      JSON.stringify(
        (subtaskData.assigned_users || []).map(userId => ({ user_id: userId }))
      )
    );

    // Only declare isUpdate once at the top of the function
    const isUpdate = !!subtaskData.subtask_id;
    // Always include task_id for subtask creation (not update)
    if (!isUpdate && taskId) {
      formData.append('task_id', taskId);
    }

    if (subtaskData.files && subtaskData.files.length > 0) {
      subtaskData.files.forEach(file => {
        formData.append("files", file);   // 👈 MUST do this
      });
    }

    formData.append('links', JSON.stringify(subtaskData.links?.filter(l => l.url) || []));

    let userId = '';
    try {
      const asyncUserId = await (await import('@react-native-async-storage/async-storage')).default.getItem('user_id');
      userId = asyncUserId || '';
    } catch {}
    if (userId) {
      formData.append('user_id', userId);
    }

    // Determine the URL and method based on whether we're creating or updating
    // (isUpdate already declared above)
    const url = isUpdate
      ? `${API_BASE_URL}subtasks/${subtaskData.subtask_id}/update/`  // Update endpoint
      : `${API_BASE_URL}tasks/${taskId}/subtasks/`;           // Create endpoint

    const method = isUpdate ? 'PATCH' : 'POST';

    console.log(`Making ${method} request to:`, url); // Debug log
    // React Native FormData does not support .entries(); skip this debug.
    // You may log individual fields manually if needed.


    const response = await fetch(url, {
      method: method,
      body: formData,
      // Don't set Content-Type header for FormData - browser will set it with boundary
    });

    const data = await response.json();
    console.log("Backend response:", data); // Debug log

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || `Failed to ${isUpdate ? 'update' : 'add'} subtask`);
    }

    return {
      success: true,
      subtask_id: data.subtask_id || subtaskData.subtask_id,
      subtask: data.subtask || subtaskData, // Return the updated subtask
      message: data.message || `Subtask ${isUpdate ? 'updated' : 'added'} successfully` 
    };
  } catch (err) {
    console.error("❌ addSubtask error:", err);
    return { success: false, error: err.message };
  }
};

// Upload attachments for a subtask
export const uploadAttachments = async (subtaskId, files, userId) => {
  try {
    const uploadFormData = new FormData();
    uploadFormData.append("user_id", userId);

    files.forEach((file) => {
      uploadFormData.append("files", file);
    });

    const response = await fetch(
      `${API_BASE_URL}subtasks/${subtaskId}/attachments/`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, attachments: data.attachments };
    }
    return { success: false, error: data.message || "Failed to upload attachments" };
  } catch (error) {
    return { success: false, error: error.message || "Error uploading attachments" };
  }
};


