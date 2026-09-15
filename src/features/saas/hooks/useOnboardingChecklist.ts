import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { onboardingChecklistService } from "../services/onboardingChecklist.service";

export function useOnboardingChecklist() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const queryClient = useQueryClient();

  const checklistQuery = useQuery({
    queryKey: queryKeys.saas.onboarding(orgId),
    queryFn: () => onboardingChecklistService.getChecklist(orgId),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ stepId, done }: { stepId: string; done: boolean }) =>
      onboardingChecklistService.toggleStep(orgId, stepId, done),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.saas.onboarding(orgId),
      });
    },
  });

  const steps = checklistQuery.data ?? [];
  const completed = steps.filter((step) => step.done).length;

  return {
    steps,
    completed,
    total: steps.length,
    loading: checklistQuery.isLoading,
    toggle: toggleMutation.mutateAsync,
  };
}
