import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getDesktopApi, isDesktopApp } from "@/desktop/types";
import { logger } from "@/lib/logger";
import {
  AuthContext,
  buildStartupState,
  type AuthContextValue,
} from "../context/AuthContext";
import { authService } from "../services/auth.service";
import { profileService } from "../services/profile.service";
import type {
  ResetPasswordParams,
  SignInParams,
  SignUpParams,
  UpdatePasswordParams,
} from "../types/auth";
import type { UserProfile } from "../types/roles";

interface AuthProviderProps {
  children: ReactNode;
}

function clearLocalAuthCaches() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith("cosmo:saas:") ||
        key.startsWith("cosmo:onboarding:")
      ) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(async (userId?: string) => {
    try {
      const data = await profileService.getMyProfile(userId);
      setProfile(data);
      return data;
    } catch (error) {
      logger.error("Erro ao carregar perfil", error);
      setProfile(null);
      return null;
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      setLoading(true);

      const currentSession = await authService.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      const ms = Math.round(
        (typeof performance !== "undefined"
          ? performance.now()
          : Date.now()) - t0
      );

      console.info(
        `[Cosmo Auth] session resolved +${ms}ms — ${
          currentSession?.user ? "authenticated" : "guest"
        }`
      );

      console.info(
        `[Cosmo Startup] auth-resolved +${ms}ms — ${
          currentSession?.user ? "authenticated" : "guest"
        }`
      );
    } catch (error) {
      logger.error("Erro ao inicializar autenticação", error);
      clearAuthState();

      console.info("[Cosmo Auth] session resolved (error) — guest");
      console.info("[Cosmo Startup] auth-resolved (error) — guest");
    } finally {
      setLoading(false);
    }
  }, [clearAuthState, loadProfile]);

  useEffect(() => {
    void bootstrap();

    const { data } = authService.onAuthStateChange(
      (event: AuthChangeEvent, nextSession) => {
        if (event === "SIGNED_OUT" || !nextSession?.user) {
          clearAuthState();
          setLoading(false);
          return;
        }

        setSession(nextSession);
        setUser(nextSession.user);

        // Mantém a tela em loading até o profile terminar de carregar.
        setLoading(true);

        // Supabase recomenda não executar chamadas pesadas
        // diretamente dentro do callback de auth.
        window.setTimeout(() => {
          void (async () => {
            try {
              await loadProfile(nextSession.user.id);
            } finally {
              setLoading(false);
            }
          })();
        }, 0);
      }
    );

    return () => data.subscription.unsubscribe();
  }, [bootstrap, clearAuthState, loadProfile]);

  const signIn = useCallback(
    async (params: SignInParams) => {
      setLoading(true);

      try {
        const { user: signedInUser } = await authService.signIn(params);
        await loadProfile(signedInUser.id);
      } finally {
        setLoading(false);
      }
    },
    [loadProfile]
  );

  const signUp = useCallback(
    async (params: SignUpParams) => {
      setLoading(true);

      try {
        const data = await authService.signUp(params);

        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        }

        return Boolean(data.session);
      } finally {
        setLoading(false);
      }
    },
    [loadProfile]
  );

  const signInWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      if (isDesktopApp()) {
        await getDesktopApi()?.clearPendingAuthCallback?.();
      }
      await authService.signOut();
    } catch (error) {
      logger.error("Erro ao encerrar sessão Supabase", error);
      throw error;
    } finally {
      // Sempre limpa estado local — guards desmontam área privada imediatamente.
      clearAuthState();
      clearLocalAuthCaches();
      setLoading(false);
    }
  }, [clearAuthState]);

  const resetPassword = useCallback(async (params: ResetPasswordParams) => {
    await authService.resetPassword(params);
  }, []);

  const updatePassword = useCallback(
    async (params: UpdatePasswordParams) => {
      await authService.updatePassword(params);
    },
    []
  );

  const reloadProfile = useCallback(async () => {
    setLoading(true);

    try {
      await loadProfile();
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const startup = useMemo(
    () => buildStartupState({ loading, user, session, profile }),
    [loading, user, session, profile]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      startup,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      reloadProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      startup,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      updatePassword,
      reloadProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
