import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { automationLogsService } from "../services/automationLogs.service";
import type { AutomationLogStatus } from "../types/automationRule";

export function useAutomationLogsQuery(status?: AutomationLogStatus) {
  return useQuery({
    queryKey: queryKeys.automations.logs(status ?? "all"),
    queryFn: () =>
      automationLogsService.getLogs({
        status,
        limit: 100,
      }),
  });
}
