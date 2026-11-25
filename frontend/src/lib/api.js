import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  timeout: 300000,
});

export function errorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    if (detail.includes('rate_limit') || detail.includes('429')) {
      return 'Groq’s free token limit was hit. Wait about 15 seconds, then ask again. A shorter question is more likely to finish.';
    }
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || JSON.stringify(item)).join(' ');
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The research request timed out. Try a narrower question, or confirm the backend is still running.';
  }
  if (!error?.response) {
    return 'Cannot reach the research API. Start the backend with python backend/app.py and keep it on port 8000.';
  }
  return error.message || 'The research service returned an error.';
}
