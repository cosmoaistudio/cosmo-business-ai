import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractProductEngineSignals(ctx: CosmoAiAnalysisContext) {
  const products = ctx.operation.products;

  return {
    active: products.filter((p) => p.status === "active").length,
    paused: products.filter((p) => p.status === "inactive").length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    lowStock: ctx.operation.stockAlerts.length,
    unavailable: products.filter(
      (p) => p.status === "inactive" || p.stock <= 0
    ).length,
  };
}
