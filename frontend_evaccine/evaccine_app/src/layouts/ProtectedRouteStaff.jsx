import { Navigate } from "react-router-dom";
import { getStorage } from "../utils/authStorage";

const getTokenExp = (jwt) => {
  try { return JSON.parse(atob(jwt.split(".")[1])).exp * 1000; } catch { return 0; }
};

export default function ProtectedRouteStaff({ user, authReady, children }) {
  if (!authReady) return null;
  const store = getStorage();
  const refresh = store.getItem("refresh");
  const valid = refresh && getTokenExp(refresh) > Date.now();
  if (!user || !valid) return <Navigate to="/login" replace />;
  return children;
}


