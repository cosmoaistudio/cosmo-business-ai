export { AuthProvider } from "./providers/AuthProvider";
export { useAuth, useAppStartup } from "./context/AuthContext";

export type {
  AuthView,
  SignInParams,
  SignUpParams,
  ResetPasswordParams,
  UpdatePasswordParams,
} from "./types/auth";

export type {
  UserRole,
  UserProfile,
  Organization,
  AppRoute,
  MembershipRole,
  CompanyMembership,
} from "./types/roles";

export {
  USER_ROLES,
  ROLE_LABELS,
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTE_BY_ROLE,
  isUserRole,
  canAccessRoute,
  getDefaultRouteForRole,
  hasOrganizationId,
  toMembershipRole,
} from "./types/roles";

export type { AppStartupState, AppStartupStatus } from "./utils/appStartup";
export {
  resolveAppStartupState,
  resolvePostAuthPath,
  isOrganizationOnboardingComplete,
} from "./utils/appStartup";

export {
  getUserDisplayName,
  getUserInitials,
} from "./repository/auth.repository";

export { default as ProtectedRoute } from "./components/ProtectedRoute";
export { default as RoleRoute } from "./components/RoleRoute";
export { default as GuestRoute } from "./components/GuestRoute";
export { default as AuthLoadingScreen } from "./components/AuthLoadingScreen";
export { default as LoginForm } from "./components/LoginForm";
export { default as SignUpForm } from "./components/SignUpForm";
export { default as ForgotPasswordForm } from "./components/ForgotPasswordForm";
export { default as ResetPasswordForm } from "./components/ResetPasswordForm";
export { default as DesktopOAuthListener } from "./components/DesktopOAuthListener";

export {
  ELECTRON_OAUTH_CALLBACK_URL,
  ELECTRON_OAUTH_PROTOCOL,
  ELECTRON_OAUTH_LANDING_URL,
  getAuthRedirectUrl,
  isElectronAuthEnvironment,
  isValidCosmoOAuthCallbackUrl,
  extractOAuthCodeFromCallbackUrl,
  buildElectronDeepLinkFromOAuthParams,
  createOAuthCallbackDedupe,
} from "./oauth/oauthRedirect";
