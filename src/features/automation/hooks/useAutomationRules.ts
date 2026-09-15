import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { automationRulesService } from "../services/automationRules.service";
import type { AutomationRuleWithLastLog } from "../types/automationRule";

export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRuleWithLastLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await automationRulesService.getAll();
      setRules(data);
    } catch (error) {
      console.error("Erro ao carregar automações:", error);
      toast.error("Não foi possível carregar as automações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rules, loading, reload };
}
