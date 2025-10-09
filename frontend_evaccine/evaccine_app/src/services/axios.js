// src/services/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

// ✅ Gửi Authorization header với access token
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem("access");
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
      console.log(`[Axios] Request to ${config.url} with token:`, access);
    } else {
      console.log(`[Axios] Request to ${config.url} WITHOUT token`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor xử lý refresh token khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token hết hạn hoặc unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        console.warn("[Axios] Không có refresh token, logout!");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh });

        // ✅ Cập nhật access mới
        localStorage.setItem("access", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        console.log("[Axios] Refresh token thành công, retry request:", originalRequest.url);

        // Gọi lại request ban đầu
        return api(originalRequest);
      } catch (refreshError) {
        console.warn("[Axios] Refresh token thất bại, logout!");
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
