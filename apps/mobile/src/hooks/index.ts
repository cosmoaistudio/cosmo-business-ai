import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInvalidateDashboard } from "@/features/dashboard";
import { authService } from "@/services/AuthService";
import { commandService } from "@/services/CommandService";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { RemoteCommandType } from "@cosmo/remote-commands";

export { useDashboard } from "@/features/dashboard";

export function useAuth() {
  const auth = useAuthStore();

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      if (!data.user) throw new Error("Sessão não retornada após login");

      const profile = await authService.getMyProfile(data.user.id);
      useAuthStore.getState().setSession({
        userId: data.user.id,
        email: data.user.email ?? email,
        profile,
        profileError: profile
          ? null
          : "Perfil não encontrado na tabela profiles. Verifique o provisionamento do usuário.",
      });

      return data;
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await authService.signOut();
      if (error) throw error;
    },
  });

  return {
    ...auth,
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,
  };
}

export function useOrganizationId() {
  return useAuthStore((state) => state.organizationId);
}

export function useInvalidateMobileQueries() {
  const queryClient = useQueryClient();
  const invalidateDashboard = useInvalidateDashboard();

  return (organizationId?: string | null) => {
    invalidateDashboard(organizationId);
    void queryClient.invalidateQueries({ queryKey: ["mobile"] });
  };
}

export function useRemoteCommand() {
  const organizationId = useOrganizationId();
  const invalidate = useInvalidateMobileQueries();

  return useMutation({
    mutationFn: async ({
      command,
      payload,
    }: {
      command: RemoteCommandType;
      payload?: Record<string, unknown>;
    }) => {
      if (!organizationId) throw new Error("Organização não encontrada");
      return commandService.dispatchTyped(organizationId, command, payload ?? {});
    },
    onSuccess: () => invalidate(organizationId),
  });
}

export function useNotificationActions() {
  const add = useNotificationStore((state) => state.add);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return { items, unreadCount, add, markRead, markAllRead };
}
