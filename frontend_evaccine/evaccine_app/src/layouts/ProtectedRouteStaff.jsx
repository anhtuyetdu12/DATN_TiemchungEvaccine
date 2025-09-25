import { Navigate } from "react-router-dom";

export default function ProtectedRouteStaff({ user, children }) {
  if (!user) {
    // Chưa login
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "staff") {
    // Không phải staff
    return <Navigate to="/" replace />;
  }

  return children;
}
