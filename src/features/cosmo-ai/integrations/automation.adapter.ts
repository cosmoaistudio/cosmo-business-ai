import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractAutomationSignals(ctx: CosmoAiAnalysisContext) {
  const logs = ctx.operation.automationLogs;
  const today = logs.filter(
    (l) => new Date(l.created_at).toDateString() === new Date().toDateString()
  );

  return {
    executedToday: today.length,
    failuresToday: today.filter((l) => l.status === "failed").length,
    recentFailures: logs
      .filter((l) => l.status === "failed")
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        ruleName: l.automation_rules?.name ?? "Automação",
        error: l.error_message,
      })),
  };
}
