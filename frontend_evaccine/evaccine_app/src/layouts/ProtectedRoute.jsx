
// src/layouts/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, children }) {
  if (!user) {
    // Nếu chưa đăng nhập thì quay về trang chủ
    return <Navigate to="/" replace />;
  }
  return children;
}
