import axios from "axios";

interface ApiResponse {
  success: boolean;
  message?: string;
}

async function postData(inputText: string): Promise<ApiResponse | null> {
  const url =
    "https://idx-aai-server-15683884-819439158385.asia-south1.run.app/ask_ai";
  const payload = { question: inputText };

  try {
    const response = await axios.post<ApiResponse>(url, payload);
    // Access response data
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Access error message or response from server
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      // Non-Axios error
      console.error("Unexpected error:", error);
    }
    return null;
  }
}

export { postData };
