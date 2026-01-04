// src/services/axios.js
import axios from "axios";
import { getStorage, clearAllAuth } from "../utils/authStorage";

const api = axios.create({ baseURL: "http://127.0.0.1:8000/api/" });

api.interceptors.request.use((config) => {
  const access =
    sessionStorage.getItem("access") || localStorage.getItem("access");
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || originalRequest._retry || originalRequest.url?.includes("/api/token/refresh/")) {
      return Promise.reject(error);
    }

    if (status === 401) {
      originalRequest._retry = true;
      const store = getStorage();
      const refresh = store.getItem("refresh");
      if (!refresh) {
        clearAllAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
         const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh });
         const { access: newAccess, refresh: newRefresh } = res.data || {};
         if (newAccess) {
           store.setItem("access", newAccess);
         }
         if (newRefresh) {
           store.setItem("refresh", newRefresh);
         }
         if (newAccess) {
           originalRequest.headers.Authorization = `Bearer ${newAccess}`;
           return api(originalRequest);
         }
      } catch (e) {
        clearAllAuth();
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;