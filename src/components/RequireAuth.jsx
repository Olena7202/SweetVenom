import { Navigate } from "react-router-dom";
import { getCurrentUser, getDashboardPathByRole } from "../services/authStorage";

export default function RequireAuth({ allowedRole, children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={getDashboardPathByRole(currentUser.role)} replace />;
  }

  return children;
}
