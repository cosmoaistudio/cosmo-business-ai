import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
  UpdatePasswordParams,
} from "../types/auth";
import type { UserProfile } from "../types/roles";
import type { AppStartupState } from "../utils/appStartup";
import { resolveAppStartupState } from "../utils/appStartup";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Single source of truth for post-auth routing */
  startup: AppStartupState;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<void>;
  updatePassword: (params: UpdatePasswordParams) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}

export function buildStartupState(input: {
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
}): AppStartupState {
  return resolveAppStartupState({
    loading: input.loading,
    hasSessionUser: Boolean(input.session?.user),
    hasUser: Boolean(input.user),
    userId: input.user?.id ?? input.session?.user?.id,
    hasProfile: Boolean(input.profile),
    organizationId: input.profile?.organization_id,
    role: input.profile?.role,
    organization: input.profile?.organizations,
  });
}

export function useAppStartup(): AppStartupState {
  const { startup } = useAuth();
  return startup;
}
