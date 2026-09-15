import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  canAccessRoute,
  getDefaultRouteForRole,
  type AppRoute,
} from "../types/roles";

interface RoleRouteProps {
  path: AppRoute;
  children: React.ReactNode;
}

/**
 * Role gate after ProtectedRoute. Without role → login (never keep private UI).
 */
export default function RoleRoute({ path, children }: RoleRouteProps) {
  const { profile, user, session, loading } = useAuth();
  const role = profile?.role;
  const isAuthenticated = Boolean(session?.user ?? user);

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(role, path)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
}
