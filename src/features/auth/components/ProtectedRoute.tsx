import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolvePrivateRouteAccess } from "../utils/authGate";
import AuthLoadingScreen from "./AuthLoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Gate for every private area. No session → login.
 * Incomplete company onboarding → /onboarding (never role default /cozinha).
 * Loading → never flash private UI.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, profile, loading } = useAuth();
  const location = useLocation();
  const loggedRoute = useRef(false);

  const decision = resolvePrivateRouteAccess({
    loading,
    hasSessionUser: Boolean(session?.user),
    hasUser: Boolean(user),
    hasProfile: Boolean(profile),
    userId: user?.id ?? session?.user?.id,
    organizationId: profile?.organization_id,
    role: profile?.role,
    organization: profile?.organizations,
    path: location.pathname,
  });

  useEffect(() => {
    if (loading || loggedRoute.current) return;
    loggedRoute.current = true;
    console.info(
      `[Cosmo Startup] route-ready — ${
        decision === "allow" ||
        decision === "no-profile" ||
        decision === "onboarding" ||
        decision === "redirect-dashboard"
          ? "authenticated"
          : "guest"
      } ${location.pathname}`
    );
  }, [loading, decision, location.pathname]);

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "login") {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  if (decision === "no-profile") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Perfil não configurado
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Sua conta não possui organização vinculada. Entre em contato com o
            administrador ou crie uma nova conta.
          </p>
        </div>
      </div>
    );
  }

  if (decision === "onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (decision === "redirect-dashboard") {
    return <Navigate to="/" replace />;
  }

  return children;
}
