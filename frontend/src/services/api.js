import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000",
});

// request: só adiciona Authorization se existir token real
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// response: se vier 401, faz logout automático
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      // opcional: redirecionar para /login
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
