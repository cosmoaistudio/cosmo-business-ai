import type { AutomationLog } from "@/features/automation/types/automationRule";

export function countAutomationFailuresToday(logs: AutomationLog[]) {
  return logs.filter((log) => log.status === "failed").length;
}

export function extractAutomationInsights(logs: AutomationLog[]) {
  return logs.slice(0, 5).map((log) => ({
    id: log.id,
    name: log.automation_rules?.name ?? "Automação",
    status: log.status,
    createdAt: log.created_at,
  }));
}
