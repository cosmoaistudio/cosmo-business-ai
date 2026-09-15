import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractPdvSignals(ctx: CosmoAiAnalysisContext) {
  return {
    salesToday: ctx.operation.salesTodayCount,
    revenueToday: ctx.operation.salesTodayTotal,
    openCashSessions: ctx.operation.cashSessions.length,
    recentSales: ctx.operation.sales.slice(0, 10).map((s) => ({
      id: s.id,
      number: s.sale_number,
      total: s.total,
      createdAt: s.created_at,
    })),
  };
}
