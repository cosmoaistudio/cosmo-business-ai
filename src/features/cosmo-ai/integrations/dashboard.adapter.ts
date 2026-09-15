import type { DashboardStats } from "@/features/dashboard";
import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function toDashboardInsightSnapshot(stats: DashboardStats) {
  return {
    todayRevenue: stats.todayRevenue,
    todaySales: stats.todaySales,
    averageTicket: stats.averageTicket,
    topProduct: stats.topSellingProducts[0] ?? null,
    stockAlertCount: stats.stockAlerts.length,
    profitToday: stats.finance.profitToday,
  };
}

export function enrichContextFromDashboard(
  context: CosmoAiAnalysisContext,
  stats: DashboardStats
): CosmoAiAnalysisContext {
  return {
    ...context,
    dashboard: stats,
    analyzedAt: new Date().toISOString(),
  };
}
