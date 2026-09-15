import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_QUERY_OPTIONS,
  dashboardQueries,
} from "../queries/dashboard.queries";
import { dashboardService } from "../services/dashboard.service";

export function useDashboard(organizationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: dashboardQueries.snapshot(organizationId ?? "unknown"),
    enabled: Boolean(organizationId),
    queryFn: () => dashboardService.getSnapshot(organizationId!),
    ...DASHBOARD_QUERY_OPTIONS,
  });

  useEffect(() => {
    if (!organizationId) return;

    const unsubscribe = dashboardService.subscribe(organizationId, () => {
      void queryClient.invalidateQueries({
        queryKey: dashboardQueries.snapshot(organizationId),
      });
    });

    return unsubscribe;
  }, [organizationId, queryClient]);

  return query;
}

export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return (organizationId?: string | null) => {
    if (organizationId) {
      void queryClient.invalidateQueries({
        queryKey: dashboardQueries.snapshot(organizationId),
      });
      return;
    }

    void queryClient.invalidateQueries({ queryKey: dashboardQueries.all });
  };
}
