import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { automationRulesService } from "../services/automationRules.service";

export function useAutomationRulesQuery() {
  return useQuery({
    queryKey: queryKeys.automations.rules(),
    queryFn: () => automationRulesService.getAll(),
  });
}
