import { useCallback, useEffect } from "react";
import { authService } from "@/services/AuthService";
import { useAuthStore } from "@/store/authStore";

function formatAuthError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Erro desconhecido ao carregar perfil";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setLoading = useAuthStore((state) => state.setLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const clear = useAuthStore((state) => state.clear);

  const loadSession = useCallback(
    async (userId: string, email: string | null) => {
      try {
        const profile = await authService.getMyProfile(userId);

        setSession({
          userId,
          email,
          profile,
          profileError: profile
            ? null
            : "Perfil não encontrado na tabela profiles. Verifique o provisionamento do usuário.",
        });
      } catch (error) {
        setSession({
          userId,
          email,
          profile: null,
          profileError: formatAuthError(error),
        });
      }
    },
    [setSession]
  );

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setLoading(true);

      try {
        const { data, error } = await authService.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session?.user) {
          if (mounted) clear();
          return;
        }

        await loadSession(session.user.id, session.user.email ?? null);
      } catch (error) {
        if (mounted) {
          clear();
          if (__DEV__) {
            console.error("[Cosmo Mobile] Falha no bootstrap de auth:", error);
          }
        }
      }
    }

    void bootstrap();

    const { data: subscription } = authService.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          clear();
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });

        await loadSession(session.user.id, session.user.email ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [clear, loadSession, setLoading]);

  return <>{children}</>;
}
