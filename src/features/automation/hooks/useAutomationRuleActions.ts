import { useCallback, useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { getErrorMessage } from "@/lib/errors";
import { automationRulesService } from "../services/automationRules.service";
import type { AutomationRule } from "../types/automationRule";

export function useAutomationRuleActions(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      try {
        setLoading(true);
        await action();
        toast.success(successMessage);
        emitDataChanged();
        onSuccess?.();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const toggleEnabled = useCallback(
    (rule: AutomationRule) =>
      runAction(
        () => automationRulesService.toggleEnabled(rule),
        rule.enabled ? "Automação desativada" : "Automação ativada"
      ),
    [runAction]
  );

  const duplicateRule = useCallback(
    (id: string) =>
      runAction(
        () => automationRulesService.duplicate(id),
        "Automação duplicada"
      ),
    [runAction]
  );

  const deleteRule = useCallback(
    (id: string) =>
      runAction(
        () => automationRulesService.remove(id),
        "Automação excluída"
      ),
    [runAction]
  );

  return {
    loading,
    toggleEnabled,
    duplicateRule,
    deleteRule,
  };
}
