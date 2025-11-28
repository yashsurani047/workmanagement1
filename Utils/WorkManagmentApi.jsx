
const API_BASE = "http://127.0.0.1:8000/api/";
import axios from "axios";


export const getUserProfile = async (user_id) => {
  try {
    const response = await axios.get(
      `${API_BASE}user-profile/${user_id}/`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    const data = response.data;
    // //console.log(response.data);
    
    // Convert base64 image data to displayable format
    if (data.profile_pic) {
      data.profile_pic = `data:image/jpeg;base64,${data.profile_pic}`;
    }
    
    return data;

  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};