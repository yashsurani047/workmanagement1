import axios from "axios";
const API_BASE = `http://127.0.0.1:8000/api/`

export const fetchOrganizationLogo = async (organizationId) => {
  if (!organizationId) return null;

  try {
    const response = await axios.get(
      `${API_BASE}organization/${organizationId}/logo/`
    );

    if (response.data.status === "success") {
      return response.data.organization_logo;
    }

    return null;
  } catch (error) {
    console.error("Error fetching organization logo:", error);
    return null;
  }
};


export const getUserSubRoles = async (userId) => {
    const response = await axios.get(`${API_BASE}get-sub-roles/${userId}/`);
    return response.data;
  };
  