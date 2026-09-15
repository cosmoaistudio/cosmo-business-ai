import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SAAS_PLANS, getPlanById } from "../catalog/plans.catalog";
import { createLimitsEngine } from "../services/limitsEngine";
import { listBillingAdapters } from "../services/billing/billingRegistry";
import { subscriptionService } from "../services/subscription.service";
import type { SaasLimitResource } from "../types/limits";
import type { SaasPlanId } from "../types/plans";

const USAGE_TO_LIMIT: Record<string, SaasLimitResource> = {
  products: "products",
  users: "users",
  stores: "stores",
  ordersThisMonth: "ordersPerMonth",
  aiCreditsUsed: "aiCreditsPerMonth",
  automations: "automations",
  contentPieces: "contentPieces",
  campaigns: "campaigns",
};

export function useMyPlan() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? null;
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: queryKeys.saas.subscription(orgId),
    queryFn: () => subscriptionService.getSubscription(orgId),
  });

  const usageQuery = useQuery({
    queryKey: queryKeys.saas.usage(orgId),
    queryFn: () => subscriptionService.getUsageSnapshot(),
  });

  const setPlanMutation = useMutation({
    mutationFn: (planId: SaasPlanId) =>
      subscriptionService.setPlan(orgId, planId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.saas.subscription(orgId),
      });
    },
  });

  const plan = useMemo(
    () => getPlanById(subscriptionQuery.data?.planId ?? "professional"),
    [subscriptionQuery.data?.planId]
  );

  const meters = useMemo(() => {
    const usage = usageQuery.data;
    const engine = createLimitsEngine(
      (subscriptionQuery.data?.planId ?? "professional") as SaasPlanId
    );
    if (!usage) return [];

    return Object.entries(USAGE_TO_LIMIT).map(([usageKey, resource]) => {
      const used = usage[usageKey as keyof typeof usage] as number;
      const check = engine.check(resource, used);
      return {
        ...check,
        label: resource,
      };
    });
  }, [subscriptionQuery.data?.planId, usageQuery.data]);

  return {
    subscription: subscriptionQuery.data,
    usage: usageQuery.data,
    plan,
    plans: SAAS_PLANS,
    meters,
    billingAdapters: listBillingAdapters(),
    loading: subscriptionQuery.isLoading || usageQuery.isLoading,
    setPlan: setPlanMutation.mutateAsync,
    settingPlan: setPlanMutation.isPending,
  };
}
