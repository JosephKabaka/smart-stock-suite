import axios from "axios";

// This automatically picks up your Localhost or Render URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Automatically add the token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
