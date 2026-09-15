import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { diagnosticsService } from "../services/diagnostics.service";

export function useDiagnostics() {
  return useQuery({
    queryKey: queryKeys.saas.diagnostics(),
    queryFn: () => diagnosticsService.getSnapshot(),
  });
}
