import axios from "axios";

export const getAllTickets = async () => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/api/tickets/all/");
    console.log("📡 API Response:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ API Error:", err);
    return { success: false, error: err.message, data: [] };
  }
};

export const shareTicketAsTask = async (ticketData) => {
  try {
    const response = await axios.post(`http://127.0.0.1:8000/api/share-ticket/`, ticketData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error sharing ticket as task:", error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || "Server error",
      };
    } else {
      return {
        success: false,
        error: "Network error",
      };
    }
  }
};