// src/Utils/Projects/taskDetailsApi.js
const API_BASE_URL = "http://127.0.0.1:8000/api/";


// ✅ Get subtasks for a task
export const fetchSubtasks = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}tasks/${taskId}/subtasks/list/`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch subtasks");
    }

    return { success: true, subtasks: data.subtasks };
  } catch (err) {
    console.error("❌ fetchSubtasks error:", err);
    return { success: false, error: err.message, subtasks: [] };
  }
};

// export const updateSubtaskStatus = async ({ subtask_id, task_id, user_id, organization_id, new_status, changed_by }) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}subtasks/update-status/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         subtask_id,
//         task_id,
//         user_id,
//         organization_id,
//         new_status,
//         changed_by
//       }),
//     });

//     if (!response.ok) throw new Error("Failed to update subtask status");

//     const data = await response.json();
//     return { success: true, subtask: data };
//   } catch (error) {
//     console.error("❌ updateSubtaskStatus error:", error);
//     return { success: false, error: error.message };
//   }
// };


export const updateSubtaskStatus = async (statusData) => {
    try {
        const response = await fetch(`${API_BASE_URL}subtasks/update-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statusData),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating subtask status:', error);
        return { success: false, error: error.message };
    }
};




export const fetchAttachments = async (subtaskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}subtasks/${subtaskId}/attachments/`);
    const data = await response.json();

    if (data.success) {
      return { success: true, attachments: data.attachments };
    }
    return { success: false, error: data.error || "Failed to fetch attachments" };
  } catch (error) {
    return { success: false, error: error.message || "Error fetching attachments" };
  }
};


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

    if (subtaskData.files && subtaskData.files.length > 0) {
      subtaskData.files.forEach(file => {
        formData.append("files", file);   // 👈 MUST do this
      });
    }

    formData.append('links', JSON.stringify(subtaskData.links?.filter(l => l.url) || []));

    const userId = sessionStorage.getItem('user_id');
    if (userId) {
      formData.append('user_id', userId);
    }

    // Determine the URL and method based on whether we're creating or updating
    const isUpdate = !!subtaskData.subtask_id;

    // Use the correct endpoint for updates
    const url = isUpdate
      ? `${API_BASE_URL}subtasks/${subtaskData.subtask_id}/update/`  // Update endpoint
      : `${API_BASE_URL}tasks/${taskId}/subtasks/`;           // Create endpoint

    const method = isUpdate ? 'PATCH' : 'POST';

    console.log(`Making ${method} request to:`, url); // Debug log
    console.log("FormData contents:"); // Debug log
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

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

export const deleteAttachment = async (attachmentId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}attachments/${attachmentId}/`,
      {
        method: "DELETE",
      }
    );

    // If no content is returned (typical for DELETE), handle gracefully
    if (response.status === 204) {
      return { success: true };
    }

    // If backend sends JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error in deleteAttachment util:", error);
    return { success: false, error };
  }
};



// ✅ Delete a subtask
export const deleteSubtask = async (subtaskId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}subtasks/${subtaskId}/delete/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete subtask");
    }

    return { success: true, message: "Subtask deleted successfully" };
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return { success: false, error: error.message };
  }
};


// ✅ Toggle subtask status
export const toggleSubtaskStatus = async (subtaskId, newStatus) => {
  try {
    const response = await fetch(`${API_BASE_URL}subtasks/${subtaskId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update subtask status");
    }

    return { success: true };
  } catch (err) {
    console.error("❌ toggleSubtaskStatus error:", err);
    return { success: false, error: err.message };
  }
};


export const updateSubtask = async (subtaskId, payload) => {
  const response = await fetch(`${API_BASE_URL}subtasks/${subtaskId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};