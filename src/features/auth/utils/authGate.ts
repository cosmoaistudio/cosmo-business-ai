import {
  resolveAppStartupState,
  isOrganizationOnboardingComplete,
  type AppStartupState,
} from "./appStartup";

export type PrivateRouteDecision =
  | "loading"
  | "login"
  | "no-profile"
  | "onboarding"
  | "redirect-dashboard"
  | "allow";

/**
 * Pure decision for ProtectedRoute — unit-tested without React tree.
 * Onboarding gate has priority over role defaults (never auto-/cozinha while incomplete).
 */
export function resolvePrivateRouteAccess(input: {
  loading: boolean;
  hasSessionUser: boolean;
  hasUser: boolean;
  hasProfile: boolean;
  userId?: string | null;
  organizationId?: string | null;
  role?: string | null;
  organization?: {
    onboarding_completed?: boolean | null;
    name?: string | null;
  } | null;
  /** Current path — used to allow /onboarding while incomplete */
  path?: string;
}): PrivateRouteDecision {
  const startup = resolveAppStartupState({
    loading: input.loading,
    hasSessionUser: input.hasSessionUser,
    hasUser: input.hasUser,
    userId: input.userId,
    hasProfile: input.hasProfile,
    organizationId: input.organizationId,
    role: input.role,
    organization: input.organization,
  });

  switch (startup.status) {
    case "loading":
      return "loading";
    case "guest":
      return "login";
    case "no_profile":
      return "no-profile";
    case "needs_onboarding":
      return input.path === "/onboarding" ? "allow" : "onboarding";
    case "ready":
      if (input.path === "/onboarding") return "redirect-dashboard";
      return "allow";
    default:
      return "login";
  }
}

export type GuestRouteDecision =
  | "loading"
  | "no-profile"
  | "redirect-onboarding"
  | "redirect-app"
  | "show-login";

export function resolveGuestRouteAccess(input: {
  loading: boolean;
  hasSessionUser: boolean;
  hasUser: boolean;
  hasProfile: boolean;
  isPasswordReset: boolean;
  userId?: string | null;
  organizationId?: string | null;
  role?: string | null;
  organization?: {
    onboarding_completed?: boolean | null;
    name?: string | null;
  } | null;
}): GuestRouteDecision {
  if (input.loading) return "loading";

  const isAuthenticated = input.hasSessionUser || input.hasUser;
  if (isAuthenticated && !input.hasProfile && !input.isPasswordReset) {
    return "no-profile";
  }

  if (isAuthenticated && input.hasProfile && !input.isPasswordReset) {
    const completed = isOrganizationOnboardingComplete(input.organization);
    const orgId = input.organizationId?.trim();
    if (!orgId || !completed) {
      return "redirect-onboarding";
    }
    return "redirect-app";
  }

  return "show-login";
}

export function getStartupFromAuth(input: {
  loading: boolean;
  hasSessionUser: boolean;
  hasUser: boolean;
  userId?: string | null;
  hasProfile: boolean;
  organizationId?: string | null;
  role?: string | null;
  organization?: {
    onboarding_completed?: boolean | null;
    name?: string | null;
  } | null;
}): AppStartupState {
  return resolveAppStartupState(input);
}

export { resolveAppStartupState, isOrganizationOnboardingComplete };
export type { AppStartupState };
