export const API_BASE_URL = 'http://127.0.0.1:8000/api/'; // Base URL for backend

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

// Fetch tasks for user
export const fetchTasks = async () => {
    try {
      const organizationId = sessionStorage.getItem('organization_id') || 'one';
      const user_id = sessionStorage.getItem('user_id');
  
      const [tasksResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}personal-tasks/organizations/${organizationId}/list/?user_id=${user_id}`).then(res => res.json()),
        fetchUsers(organizationId)
      ]);
  
      const orgTasks = tasksResponse?.tasks || [];
      const users = usersResponse.success ? usersResponse.users : [];
  
      return {
        tasks: orgTasks,
        users,
        taskStats: {
          total: orgTasks.length,
          completed: orgTasks.filter(t => t.status === 'completed').length,
          in_progress: orgTasks.filter(t => t.status === 'in_progress').length,
          not_started: orgTasks.filter(t => t.status === 'not_started').length,
          rejected: orgTasks.filter(t => t.status === 'rejected').length,
          pending: orgTasks.filter(t => t.status === 'pending').length,
          cancelled: orgTasks.filter(t => t.status === 'cancelled').length,
          on_hold: orgTasks.filter(t => t.status === 'on_hold').length,
          archived: orgTasks.filter(t => t.status === 'archived').length,
        }
      };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };
  
  // Create task
  export const createTask = async (organizationId, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}personal-tasks/organizations/${organizationId}/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }
  
      const responseData = await response.json();
      return { success: true, task: responseData.task };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message || 'Failed to create task' };
    }
  };
  
// -----------------------------
// ✅ Update Personal Task
// -----------------------------
export const updatePersonalTask = async (organizationId, taskId, updatedData) => {
  try {
    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/${taskId}/update/`;
    console.log('🔵 Updating personal task at:', url);
    console.log('📦 Update data being sent:', JSON.stringify(updatedData, null, 2));
    console.log('🔍 Data types:', {
      title: typeof updatedData.title,
      description: typeof updatedData.description,
      priority: typeof updatedData.priority,
      status: typeof updatedData.status
    });

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    console.log('📊 Response status:', response.status, response.statusText);
    
    // Check if response is HTML (error page)
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // Handle HTML response (error page)
      const text = await response.text();
      console.error('❌ Server returned HTML instead of JSON:', text.substring(0, 500));
      throw new Error(`Server error (Status: ${response.status}). Please check if the task exists.`);
    }
    
    console.log('📨 Server response:', result);
    
    if (response.ok && result.success) {
      console.log('✅ Personal task updated successfully');
      return { success: true, task: result.task, message: 'Task updated successfully' };
    } else {
      console.error('❌ Server returned error:', result);
      throw new Error(result.error || result.details || `Failed to update task (Status: ${response.status})`);
    }
  } catch (error) {
    console.error('❌ Error updating personal task:', error);
    return { success: false, error: error.message };
  }
};

// -----------------------------
// ✅ Delete Task (Generic)
// -----------------------------
export const deletePersonalTask = async (organizationId, taskId) => {
  try {
    const url = `${API_BASE_URL}personal-tasks/organizations/${organizationId}/${taskId}/delete/`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, error: error.message };
  }
  };