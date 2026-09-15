import { Navigate, useSearchParams } from "react-router-dom";

import { CosmoVoid } from "@/components/auth-experience/BrandUniverse";
import { CosmoBrandEntry } from "@/components/auth-experience/CosmoBrandEntry";
import "@/components/auth-experience/styles/brand-experience.css";

import AuthLoadingScreen from "./AuthLoadingScreen";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteForRole } from "../types/roles";
import { resolveGuestRouteAccess } from "../utils/authGate";
import { resolvePostAuthPath } from "../utils/appStartup";

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * /login gate. Post-auth destination comes from startup state + role default.
 * Never prefers a stale "from" path (avoids incorrect /cozinha jumps).
 */
export default function GuestRoute({ children }: GuestRouteProps) {
  const { user, session, profile, loading, startup } = useAuth();
  const [searchParams] = useSearchParams();
  const isPasswordReset = searchParams.get("mode") === "reset";

  const decision = resolveGuestRouteAccess({
    loading,
    hasSessionUser: Boolean(session?.user),
    hasUser: Boolean(user),
    hasProfile: Boolean(profile),
    isPasswordReset,
    userId: user?.id ?? session?.user?.id,
    organizationId: profile?.organization_id,
    role: profile?.role,
    organization: profile?.organizations,
  });

  if (decision === "loading") {
    return <AuthLoadingScreen />;
  }

  if (decision === "no-profile") {
    return (
      <div className="cosmo-brand-error">
        <CosmoVoid introPhase={6} />
        <div className="cosmo-brand-error__panel">
          <h1 className="cosmo-portal__title">Perfil não configurado</h1>
          <p className="cosmo-portal__subtitle mt-3">
            Sua conta não possui organização vinculada. Entre em contato com o
            administrador ou crie uma nova conta.
          </p>
        </div>
      </div>
    );
  }

  if (decision === "redirect-onboarding") {
    return (
      <>
        <CosmoBrandEntry />
        <Navigate to="/onboarding" replace />
      </>
    );
  }

  if (decision === "redirect-app") {
    const roleDefault = getDefaultRouteForRole(profile?.role);
    const targetPath = resolvePostAuthPath({
      startup,
      roleDefaultPath: roleDefault,
    });

    return (
      <>
        <CosmoBrandEntry />
        <Navigate to={targetPath} replace />
      </>
    );
  }

  return children;
}
