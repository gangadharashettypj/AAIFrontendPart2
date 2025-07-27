import axios from "axios";

async function postData(inputText: string): Promise<any | null> {
  const url = "http://127.0.0.1:5000/ask_ai";
  const payload = { question: inputText };

  try {
    const response = await axios.post<any>(url, payload);
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
