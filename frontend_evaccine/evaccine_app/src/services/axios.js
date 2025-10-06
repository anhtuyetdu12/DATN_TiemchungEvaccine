// src/services/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// ✅ Thêm Authorization header cho mọi request
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem("access");
    if (access) config.headers.Authorization = `Bearer ${access}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor xử lý token hết hạn (refresh tự động)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu token hết hạn (401) → thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh });

          // ✅ Cập nhật token mới
          localStorage.setItem("access", res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

          // ✅ Gọi lại request ban đầu
          return api(originalRequest);
        } catch (err) {
          console.warn("Token refresh thất bại → logout.");
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
