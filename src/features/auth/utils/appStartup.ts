export type AppStartupStatus =
  | "loading"
  | "guest"
  | "no_profile"
  | "needs_onboarding"
  | "ready";

export type AppStartupState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "no_profile" }
  | {
      status: "needs_onboarding";
      userId: string;
      organizationId: string | null;
    }
  | {
      status: "ready";
      userId: string;
      organizationId: string;
      role: string;
      onboardingCompleted: true;
    };

export function isOrganizationOnboardingComplete(
  organization:
    | {
        onboarding_completed?: boolean | null;
        name?: string | null;
      }
    | null
    | undefined
): boolean {
  if (!organization) return false;
  if (organization.onboarding_completed === true) return true;
  // Migration ainda não aplicada / coluna ausente no embed: não bloquear tenants.
  if (organization.onboarding_completed == null) return true;
  return false;
}

/**
 * Single source of truth for post-auth routing.
 * Never sends users to /cozinha based on stale navigation — only role defaults when ready.
 */
export function resolveAppStartupState(input: {
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
  if (input.loading) {
    return { status: "loading" };
  }

  const isAuthenticated = input.hasSessionUser || input.hasUser;
  if (!isAuthenticated || !input.userId) {
    return { status: "guest" };
  }

  if (!input.hasProfile) {
    return { status: "no_profile" };
  }

  const orgId = input.organizationId?.trim() || null;
  const completed = isOrganizationOnboardingComplete(input.organization);

  if (!orgId || !completed) {
    return {
      status: "needs_onboarding",
      userId: input.userId,
      organizationId: orgId,
    };
  }

  return {
    status: "ready",
    userId: input.userId,
    organizationId: orgId,
    role: input.role ?? "admin",
    onboardingCompleted: true,
  };
}

export function resolvePostAuthPath(input: {
  startup: AppStartupState;
  roleDefaultPath: string;
}): string {
  switch (input.startup.status) {
    case "loading":
      return "/login";
    case "guest":
    case "no_profile":
      return "/login";
    case "needs_onboarding":
      return "/onboarding";
    case "ready":
      // Dashboard is the default home for ready operators; role may override (pdv/cozinha).
      return input.roleDefaultPath || "/";
    default:
      return "/login";
  }
}
