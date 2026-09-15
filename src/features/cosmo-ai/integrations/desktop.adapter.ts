import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractDesktopSignals(ctx: CosmoAiAnalysisContext) {
  return {
    online: ctx.connectivity.desktopOnline,
    total: ctx.connectivity.desktopTotal,
    cashiersOnline: ctx.connectivity.cashiersOnline,
    agents: ctx.operation.desktopAgents.map((a) => ({
      id: a.id,
      name: a.device_name,
      status: a.status,
      lastSeen: a.last_seen_at,
    })),
  };
}
