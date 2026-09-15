import { queryKeys } from "@/lib/queryKeys";

export const dashboardQueries = {
  all: queryKeys.dashboard.all,
  snapshot: (organizationId: string) =>
    queryKeys.dashboard.snapshot(organizationId),
};

export const DASHBOARD_QUERY_OPTIONS = {
  staleTime: 20_000,
  refetchInterval: 30_000,
} as const;
