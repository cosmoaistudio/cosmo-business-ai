import { useMemo, useState } from "react";
import {
  ACTION_CATALOG,
  TRIGGER_CATALOG,
} from "../catalog";
import type { NodeFlowDraft, AutomationsHubSectionId } from "../types/automationsHub";
import { useAutomationLogsQuery } from "./useAutomationLogsQuery";
import { useAutomationRulesQuery } from "./useAutomationRulesQuery";

const DEFAULT_DRAFT: NodeFlowDraft = {
  triggerKey: "SALE_COMPLETED",
  conditionSummary: "Sempre (sem filtro)",
  actionKeys: ["UPDATE_BUSINESS_BRAIN", "UPDATE_DASHBOARD", "LOG_ACTIVITY"],
};

export function useAutomationsHub() {
  const [section, setSection] = useState<AutomationsHubSectionId>("overview");
  const [draft, setDraft] = useState<NodeFlowDraft>(DEFAULT_DRAFT);
  const [libraryTab, setLibraryTab] = useState<"triggers" | "actions">(
    "triggers"
  );

  const rulesQuery = useAutomationRulesQuery();
  const logsQuery = useAutomationLogsQuery();

  const overviewStats = useMemo(() => {
    const rules = rulesQuery.data ?? [];
    const logs = logsQuery.data ?? [];
    const enabled = rules.filter((rule) => rule.enabled).length;
    const failed = logs.filter((log) => log.status === "failed").length;
    const success = logs.filter((log) => log.status === "success").length;
    const running = logs.filter(
      (log) => !log.finished_at && log.status !== "failed"
    ).length;

    return {
      rules: rules.length,
      enabled,
      liveTriggers: TRIGGER_CATALOG.filter((t) => t.availability === "live")
        .length,
      plannedTriggers: TRIGGER_CATALOG.filter((t) => t.availability === "planned")
        .length,
      liveActions: ACTION_CATALOG.filter((a) => a.availability === "live")
        .length,
      plannedActions: ACTION_CATALOG.filter((a) => a.availability === "planned")
        .length,
      executions: logs.length,
      success,
      failed,
      running,
    };
  }, [logsQuery.data, rulesQuery.data]);

  return {
    section,
    setSection,
    draft,
    setDraft,
    libraryTab,
    setLibraryTab,
    rulesQuery,
    logsQuery,
    overviewStats,
    triggers: TRIGGER_CATALOG,
    actions: ACTION_CATALOG,
  };
}
