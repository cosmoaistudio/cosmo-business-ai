import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { automationLogsService } from "../services/automationLogs.service";
import type { AutomationLog, AutomationLogStatus } from "../types/automationRule";

export function useAutomationLogs(ruleId?: string, status?: AutomationLogStatus) {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await automationLogsService.getLogs({
        ruleId,
        status,
        limit: 100,
      });
      setLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast.error("Não foi possível carregar os logs. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [ruleId, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { logs, loading, reload };
}
