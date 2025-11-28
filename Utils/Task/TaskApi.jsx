// src/Utils/Projects/taskApi.js

const API_BASE_URL = "http://127.0.0.1:8000/api/";
import axios from "axios";

// -----------------------------
// ✅ Create a Task
// -----------------------------
export const createTask = async (organizationId, taskData) => {
  try {
    const formData = new FormData();

    formData.append("project_id", taskData.project_id || '');
    formData.append("project_name", taskData.project_name || "");
    formData.append("title", taskData.title || "");
    formData.append("description", taskData.description || "");
    formData.append("priority", taskData.priority || "urgent_important");
    formData.append("assigned_to", JSON.stringify(taskData.assigned_to || []));
    formData.append("department_id", taskData.department_id || "");
    formData.append("due_date", taskData.due_date || "");
    formData.append("start_time", taskData.start_time || "");
    formData.append("end_time", taskData.end_time || "");
    formData.append("all_day", taskData.all_day ? "1" : "0");
    formData.append("tags", JSON.stringify(taskData.tags || []));
    formData.append("remarks", taskData.remarks || "");
    formData.append("organization_id", organizationId);

    const username = sessionStorage.getItem("username");
    const userId = sessionStorage.getItem("user_id");

    formData.append("created_by", username || "");
    formData.append("creator_user_id", userId || "");

    if (Array.isArray(taskData.attachments)) {
      taskData.attachments.forEach((attachment) => {
        if (attachment.file) {
          formData.append("attachments", attachment.file);
        }
      });
    }

    const url = `${API_BASE_URL}organizations/${organizationId}/create-task/`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { detail: errorText };
      }
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    return { success: false, error: error.message || "Error creating task" };
  }
};

// -----------------------------
// ✅ Update a Task
// -----------------------------
export const updateTask = async (organizationId, taskId, taskData) => {
  try {
    const formData = new FormData();

    formData.append("project_id", taskData.project_id);
    formData.append("project_name", taskData.project_name || "");
    formData.append("title", taskData.title);
    formData.append("description", taskData.description || "");
    formData.append("priority", taskData.priority || "urgent_important");
    formData.append("assigned_to", JSON.stringify(taskData.assigned_to || []));
    formData.append("department_id", taskData.department_id || "");
    formData.append("due_date", taskData.due_date);
    formData.append("status", taskData.status);
    formData.append("start_time", taskData.start_time || "");
    formData.append("end_time", taskData.end_time || "");
    formData.append("all_day", taskData.all_day ? "1" : "0");

    if (taskData.tags && taskData.tags.length > 0) {
      formData.append("tags", JSON.stringify(taskData.tags));
    } else {
      formData.append("tags", JSON.stringify([]));
    }

    formData.append("remarks", taskData.remarks || "");
    formData.append("organization_id", organizationId);

    const userId = sessionStorage.getItem("user_id");
    formData.append("task_id", taskId);
    formData.append("updated_by", userId || "");

    if (Array.isArray(taskData.attachments)) {
      taskData.attachments.forEach((attachment) => {
        if (attachment.file) {
          formData.append("attachments", attachment.file);
        }
      });
    }

    const url = `${API_BASE_URL}tasks/update/${organizationId}/${taskId}/`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { detail: errorText };
      }
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    return { success: false, error: error.message || "Error updating task" };
  }
};


// ✅ Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}tasks/delete/${taskId}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || "Failed to delete task");
    }

    return { success: true };
  } catch (err) {
    console.error("❌ deleteTask error:", err);
    return { success: false, error: err.message };
  }
};

// -----------------------------
// ✅ Fetch Users for Organization
// -----------------------------
export const fetchUsers = async (organizationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}get-username/${organizationId}/`);
    const data = await response.json();
    if (data.status) {
      return { success: true, users: data.users };
    }
    return { success: false, error: data.error || "Failed to fetch users" };
  } catch (error) {
    return { success: false, error: error.message || "Error fetching users" };
  }
};

// -----------------------------
// ✅ Fetch Users for Organization
// -----------------------------
export const fetchProjectUsers = async (organizationId, projectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}get-project-users/${organizationId}/${projectId}/`);
    const data = await response.json();
    if (data.status) {
      return { success: true, users: data.users };
    }
    return { success: false, error: data.error || "Failed to fetch users" };
  } catch (error) {
    return { success: false, error: error.message || "Error fetching users" };
  }
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


export const fetchTasksByProject = async (orgId, projectId) => {
  if (!orgId || !projectId) return [];
  try {
    const response = await axios.get(
      `${API_BASE_URL}organizations/${orgId}/tasks/?project_id=${projectId}`
    );
    return response.data.tasks || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
};



// ---------------------------
// Task APIs
// ---------------------------
export const listTasks = async (orgId, projectId) => {
  const response = await fetch(`${API_BASE_URL}organizations/${orgId}/tasks/?project_id=${projectId}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

export const updateTaskStatus = async (orgId, taskId, payload) => {
  console.log(payload);
  const response = await fetch(`${API_BASE_URL}tasks/update-status/${orgId}/${taskId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
};

// Get task update logs
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

export const updateTaskAssignment = async (orgId, taskId, assigneeId) => {
  const payload = {
    assignee_id: assigneeId === "unassigned" ? null : assigneeId,
    assigned_by: sessionStorage.getItem("user_id") || "unknown",
  };

  const response = await fetch(
    `${API_BASE_URL}organizations/${orgId}/tasks/${taskId}/assign/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) throw new Error(`Failed to update task assignment. Status: ${response.status}`);
  return await response.json();
};

export const fetchProjectTasks = async () => {
  try {
    const organizationId = sessionStorage.getItem("organization_id") || "one";
    const user_id = sessionStorage.getItem("user_id");

    // Fetch project tasks for the logged-in user
    const response = await fetch(
      `${API_BASE_URL}organizations/${organizationId}/user/${user_id}/tasks/`
    );
    const data = await response.json();

    const orgTasks = data?.tasks || [];

    return {
      tasks: orgTasks,
      taskStats: {
        total: orgTasks.length,
        completed: orgTasks.filter((t) => t.status === "completed").length,
        in_progress: orgTasks.filter((t) => t.status === "in_progress").length,
        not_started: orgTasks.filter((t) => t.status === "not_started").length,
        rejected: orgTasks.filter((t) => t.status === "rejected").length,
        pending: orgTasks.filter((t) => t.status === "pending").length,
        cancelled: orgTasks.filter((t) => t.status === "cancelled").length,
        on_hold: orgTasks.filter((t) => t.status === "on_hold").length,
        archived: orgTasks.filter((t) => t.status === "archived").length,
      },
    };
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
  }
};

// In Utils/Task/TaskApi.js - Update the collaborateTask function
export const collaborateTask = async (taskData) => {
  try {
    const response = await fetch('http://localhost:8000/api/task/share-collaborate/', {
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
    });

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

// src/Utils/Task/TaskApi.js
export const fetchCreatedRequests = async (userId, projectId) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/task/collaboration/created/${userId}/?project_id=${projectId}/`
    );
    const data = await res.json();
    if (data.status === "success") {
      return data.requests; // already an array, no JSON.parse needed
    }
    return [];
  } catch (error) {
    console.error("Error fetching created requests:", error);
    return [];
  }
};


export const fetchApprovalRequests = async (userId, projectId) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/task/collaboration/approvals/${userId}/?project_id=${projectId}/`
    );
    const data = await res.json();
    if (data.status === "success") {
      return data.approvals.map((req) => ({
        ...req,
        approvers: Array.isArray(req.approvers)
          ? req.approvers
          : JSON.parse(req.approvers || "[]"),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    return [];
  }
};

// src/Utils/Task/TaskApi.js
export const fetchCreatedRequestsByUserId = async (userId) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/task/collaboration/created/${userId}/`
    );
    const data = await res.json();
    if (data.status === "success") {
      return data.requests; // already an array, no JSON.parse needed
    }
    return [];
  } catch (error) {
    console.error("Error fetching created requests:", error);
    return [];
  }
};


export const fetchApprovalRequestsByUserId = async (userId) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/task/collaboration/approvals/${userId}/`
    );
    const data = await res.json();
    if (data.status === "success") {
      return data.approvals.map((req) => ({
        ...req,
        approvers: Array.isArray(req.approvers)
          ? req.approvers
          : JSON.parse(req.approvers || "[]"),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching approval requests:", error);
    return [];
  }
};

export const submitApprovalAction = async (requestId, approverId, action) => {
  try {
    const res = await fetch(
      `http://localhost:8000/api/task/collaboration/approval/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          approver_id: approverId,
          action,
        }),
      }
    );
    return await res.json();
  } catch (error) {
    console.error("Error submitting approval:", "Approved the sucessfully");
    return { success: false };
  }
};


// Keep shareTask and forwardTask functions as they are for now
export const shareTask = async (taskData) => {
  try {
    const response = await fetch('http://localhost:8000/api/task/share-collaborate/', {
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

// Fetch forward tasks created by user
export const fetchForwardTasks = async (userId, status = '') => {
  try {
    let url = `${API_BASE_URL}task/forward/requests/${userId}/`;
    if (status) {
      url += `?status=${status}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    console.error('Error fetching forward tasks:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Fetch forward task approvals for user
export const fetchForwardApprovals = async (userId, status = '') => {
  try {
    let url = `${API_BASE_URL}task/forward/approvals/${userId}/`;
    if (status) {
      url += `?status=${status}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    console.error('Error fetching forward approvals:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Approve/Reject forward task
export const approveForwardTask = async (approvalData) => {
  try {
    const response = await fetch(`${API_BASE_URL}task/forward/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approval_id: approvalData.approval_id,
        approver_id: approvalData.approver_id,
        status: approvalData.status,
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error approving forward task:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const fetchTasksByType = async (userId, taskType) => {
  try {
    const response = await fetch(`${API_BASE_URL}task/overview/${userId}/?task_type=${taskType}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    console.error('Error fetching tasks by type:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

