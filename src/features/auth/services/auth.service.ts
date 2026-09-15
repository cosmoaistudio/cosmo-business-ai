import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getDesktopApi, isDesktopApp } from "@/desktop/types";
import {
  exchangeOAuthCodeForSession,
  getAuthSession,
  sendPasswordResetEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  subscribeToAuthChanges,
  updateUserPassword,
} from "../repository/auth.repository";
import {
  ELECTRON_OAUTH_CALLBACK_URL,
  getAuthRedirectUrl,
  isElectronAuthEnvironment,
} from "../oauth/oauthRedirect";
import { setAcceptDesktopOAuthCallbacks } from "../oauth/oauthAcceptGate";
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
  UpdatePasswordParams,
} from "../types/auth";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}

export const authService = {
  async getSession() {
    const { data, error } = await getAuthSession();
    if (error) throw new Error(getErrorMessage(error));
    return data.session;
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return subscribeToAuthChanges(callback);
  },

  async signIn(params: SignInParams) {
    const { data, error } = await signInWithEmail(params);
    if (error) throw new Error(getErrorMessage(error));
    return data;
  },

  async signUp(params: SignUpParams) {
    const { data, error } = await signUpWithEmail(params);
    if (error) throw new Error(getErrorMessage(error));
    return data;
  },

  async signInWithGoogle() {
    let redirectTo = getAuthRedirectUrl("/");

    if (isElectronAuthEnvironment()) {
      setAcceptDesktopOAuthCallbacks(true);
      const desktop = getDesktopApi();
      const landing = await desktop?.ensureOAuthLandingServer?.();
      if (landing?.ok && landing.redirectUrl) {
        redirectTo = landing.redirectUrl;
      } else {
        // Fallback: direct deep link (login still works; browser tab UX weaker).
        redirectTo = ELECTRON_OAUTH_CALLBACK_URL;
      }
    }

    const { data, error } = await signInWithGoogle({ redirectTo });
    if (error) throw new Error(getErrorMessage(error));

    if (isElectronAuthEnvironment()) {
      if (!data?.url) {
        throw new Error(
          "Não foi possível iniciar o login com Google no Desktop."
        );
      }

      const desktop = getDesktopApi();
      if (!isDesktopApp() || !desktop?.openExternal) {
        throw new Error(
          "Bridge Desktop indisponível para abrir o navegador do Google."
        );
      }

      const opened = await desktop.openExternal(data.url);
      if (!opened?.ok) {
        throw new Error(
          opened?.error || "Falha ao abrir o navegador para login Google."
        );
      }
    }
  },

  async exchangeOAuthCode(code: string) {
    const { data, error } = await exchangeOAuthCodeForSession(code);
    if (error) throw new Error(getErrorMessage(error));
    return data;
  },

  async signOut() {
    setAcceptDesktopOAuthCallbacks(false);
    const { error } = await signOutUser();
    if (error) throw new Error(getErrorMessage(error));
  },

  async resetPassword(params: ResetPasswordParams) {
    const { error } = await sendPasswordResetEmail(params);
    if (error) throw new Error(getErrorMessage(error));
  },

  async updatePassword(params: UpdatePasswordParams) {
    const { error } = await updateUserPassword(params);
    if (error) throw new Error(getErrorMessage(error));
  },
};

export type { User, Session, AuthChangeEvent };
