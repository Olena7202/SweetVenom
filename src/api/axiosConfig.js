import axios from "axios";

const baseURL = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_URL || "http://localhost:5023/api").replace(/\/$/, "");

const api = axios.create({
  baseURL,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
