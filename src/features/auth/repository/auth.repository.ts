import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, supabase } from "@/config/supabase";
import { isElectronAuthEnvironment } from "../oauth/oauthRedirect";
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
  UpdatePasswordParams,
} from "../types/auth";

export async function getAuthSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signInWithEmail({ email, password }: SignInParams) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail({
  email,
  password,
  fullName,
  companyName,
}: SignUpParams) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
      },
      emailRedirectTo: getAuthRedirectUrl("/login"),
    },
  });
}

export async function signInWithGoogle(options?: { redirectTo?: string }) {
  const desktop = isElectronAuthEnvironment();
  const redirectTo = options?.redirectTo ?? getAuthRedirectUrl("/");

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: desktop,
    },
  });
}

export async function exchangeOAuthCodeForSession(code: string) {
  return supabase.auth.exchangeCodeForSession(code);
}

/**
 * Ends Supabase session. Prefers global revoke; always falls back to local
 * storage clear so Electron/Web cannot restore a dead session.
 */
export async function signOutUser() {
  const globalResult = await supabase.auth.signOut({ scope: "global" });
  if (!globalResult.error) {
    return globalResult;
  }

  return supabase.auth.signOut({ scope: "local" });
}

export async function sendPasswordResetEmail({ email }: ResetPasswordParams) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("/login?mode=reset"),
  });
}

export async function updateUserPassword({ password }: UpdatePasswordParams) {
  return supabase.auth.updateUser({ password });
}

export function getUserDisplayName(user: User | null) {
  if (!user) return "Usuário";

  const metadata = user.user_metadata as { full_name?: string } | undefined;
  if (metadata?.full_name) return metadata.full_name;

  return user.email?.split("@")[0] ?? "Usuário";
}

export function getUserInitials(user: User | null) {
  const name = getUserDisplayName(user);
  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
