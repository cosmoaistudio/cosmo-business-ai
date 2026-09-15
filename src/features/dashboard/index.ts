export * from "./repository/dashboard.repository";
export * from "./services/dashboard.service";
export * from "./hooks/useDashboardStats";

export type {
  DashboardStats,
  TopSellingProduct,
  TopSellingOption,
  TopCustomer,
  SalesDayPoint,
  PeriodComparison,
  DashboardComparisons,
  RecentSale,
  DailyGoalStats,
  DashboardPeriodId,
  DashboardPeriodSnapshot,
  DashboardPeriodMetrics,
  PeriodEvolutionPoint,
  WeekdayPerformancePoint,
  PeriodHighlights,
} from "./types/dashboard";

export { default as DashboardOperationalMetrics } from "./components/DashboardOperationalMetrics";
export { default as DashboardAttentionSection } from "./components/DashboardAttentionSection";
export { default as DashboardRevenueTrend } from "./components/DashboardRevenueTrend";
export { default as DashboardWeekdayPerformance } from "./components/DashboardWeekdayPerformance";
export { default as DashboardPeriodHighlights } from "./components/DashboardPeriodHighlights";
export { default as DashboardPeriodInsights } from "./components/DashboardPeriodInsights";
export { default as DashboardTopProducts } from "./components/DashboardTopProducts";
export { default as SalesChart } from "./components/SalesChart";

export { default as RevenueLineChart } from "./components/RevenueLineChart";
export { default as TopProductsChart } from "./components/TopProductsChart";
export { default as TopOptionsChart } from "./components/TopOptionsChart";
export { default as TopCustomersChart } from "./components/TopCustomersChart";
export { default as DashboardFinanceSummary } from "./components/DashboardFinanceSummary";
export { default as DashboardInsights } from "./components/DashboardInsights";
export { default as DashboardStockAlerts } from "./components/DashboardStockAlerts";
export { default as DashboardMetricCard } from "./components/DashboardMetricCard";
export { default as ComparisonBadge } from "./components/ComparisonBadge";
export { default as DashboardMetricsGrid } from "./components/DashboardMetricsGrid";
export { default as DashboardComparisonsRow } from "./components/DashboardComparisonsRow";
export { default as RecentSalesList } from "./components/RecentSalesList";
export { default as DailyGoalCard } from "./components/DailyGoalCard";
export { default as FinanceChart } from "./components/FinanceChart";
export { default as ChartPanel } from "./components/ChartPanel";
export {
  DashboardSkeleton,
  DashboardMetricCardSkeleton,
  DashboardChartSkeleton,
  DashboardListSkeleton,
  DashboardPanelSkeleton,
} from "./components/DashboardSkeleton";

export { OsHero } from "./components/os/OsHero";
export { OsAiManager } from "./components/os/OsAiManager";
export { OsPanel } from "./components/os/OsPanel";
export { OrganizationIdentityHeader } from "./components/OrganizationIdentityHeader";
export {
  buildDashboardAttentionAlerts,
} from "./utils/buildDashboardAttentionAlerts";
export type {
  AttentionAlert,
  AttentionAlertId,
  AttentionPriority,
} from "./utils/buildDashboardAttentionAlerts";
export {
  DASHBOARD_PERIOD_OPTIONS,
  DEFAULT_DASHBOARD_PERIOD,
  resolveDashboardPeriodWindows,
  isDateInRange,
} from "./utils/dashboardPeriods";
export {
  buildDashboardPeriodInsights,
  INSIGHT_THRESHOLDS,
} from "./utils/buildDashboardPeriodInsights";
export type {
  DashboardInsight,
  DashboardInsightId,
  DashboardInsightTone,
  DashboardInsightCategory,
} from "./utils/buildDashboardPeriodInsights";
export {
  buildTopProductsPresentation,
  formatSoldUnits,
  formatSharePercent,
  TOP_PRODUCTS_DISPLAY_LIMIT,
} from "./utils/buildTopProductsPresentation";
export type { TopProductPresentationRow } from "./utils/buildTopProductsPresentation";
