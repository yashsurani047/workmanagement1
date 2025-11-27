import { BASE_URL } from '../../Config/api';

/**
 * Logs in a user with username/email/phone and password.
 * @param {string} identifier - Username, email, or phone
 * @param {string} password - User password
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const loginUser = async (identifier, password) => {
  try {
    console.log('Calling login API...');
    const response = await fetch(`${BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username_or_email_or_phone: identifier,
        password,
      }),
    });
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result?.error || 'Login failed' };
    }
  } catch (e) {
    console.log('Login error:', e);
    return { success: false, error: e?.message || 'Network error' };
  }
};

/**
 * Fetches the user's profile data.
 * @param {string | number} userId - The ID of the user
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getUserProfile = async (userId) => {
  try {
    console.log('Calling user profile API for user ID:', userId);
    const response = await fetch(`${BASE_URL}/user-profile/${userId}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('User profile response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText || 'Failed to fetch user profile'}` };
    }

    const result = await response.json();
    console.log('User profile response body:', JSON.stringify(result, null, 2));
    return { success: true, data: result };
  } catch (e) {
    console.log('User profile fetch error:', e);
    return { success: false, error: e?.message || 'Network error' };
  }
};