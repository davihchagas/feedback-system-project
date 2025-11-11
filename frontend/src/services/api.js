// frontend/src/services/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000", // endereço do backend
});

// interceptador opcional para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
