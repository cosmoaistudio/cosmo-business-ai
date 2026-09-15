import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractMobileSignals(ctx: CosmoAiAnalysisContext) {
  const mobileAgents = ctx.operation.desktopAgents.filter((a) => {
    const meta = a.metadata ?? {};
    return meta.deviceType === "mobile" || a.platform === "mobile";
  });

  return {
    online: mobileAgents.filter((a) => a.status === "online").length,
    total: mobileAgents.length || ctx.connectivity.mobileOnline,
  };
}
