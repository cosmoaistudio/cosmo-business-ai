import type { CashFlowPoint } from "@/features/finance/types/finance";
import type { StockAlert } from "@/features/inventory/types/inventory";

export interface TopSellingProduct {
  productId: string;
  productName: string;
  image?: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopSellingOption {
  optionId: string;
  optionName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseAt: string;
}

export interface SalesDayPoint {
  date: string;
  label: string;
  revenue: number;
  salesCount: number;
}

export interface DashboardFinanceStats {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  balance: number;
  incomeToday: number;
  expensesToday: number;
  profitToday: number;
}

export type ComparisonTrend = "up" | "down" | "neutral";

export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number;
  trend: ComparisonTrend;
  /** false when previous period has no sales — UI must not invent a % */
  hasComparableHistory: boolean;
}

export interface DashboardComparisons {
  revenueTodayVsYesterday: PeriodComparison;
  revenueWeekVsPreviousWeek: PeriodComparison;
  revenueMonthVsPreviousMonth: PeriodComparison;
}

export interface RecentSale {
  id: string;
  saleNumber: number;
  total: number;
  createdAt: string;
  customerName: string | null;
}

export interface DailyGoalStats {
  target: number;
  current: number;
  progressPercent: number;
}

/** Evolution series point — day or hour bucket depending on period. */
export interface PeriodEvolutionPoint {
  key: string;
  label: string;
  revenue: number;
  salesCount: number;
  /** Local YYYY-MM-DD when granularity is day; null for hour buckets */
  date: string | null;
  hour: number | null;
}

export interface WeekdayPerformancePoint {
  /** 0 = Monday … 6 = Sunday */
  weekdayIndex: number;
  label: string;
  revenue: number;
  salesCount: number;
  averageTicket: number;
}

export interface PeriodBestWeekday {
  weekdayIndex: number;
  label: string;
  revenue: number;
  salesCount: number;
  /** Copy tone depends on sample size / period */
  summaryLabel: string;
}

export interface PeriodBestCalendarDay {
  date: string;
  label: string;
  revenue: number;
  salesCount: number;
}

export interface PeriodHighlights {
  bestWeekday: PeriodBestWeekday | null;
  bestCalendarDay: PeriodBestCalendarDay | null;
}

export type DashboardPeriodId = "today" | "last_7_days" | "last_30_days";

/** Metrics for one selectable analysis period (rolling windows). */
export interface DashboardPeriodSnapshot {
  period: DashboardPeriodId;
  label: string;
  shortLabel: string;
  comparisonHint: string;
  revenue: number;
  salesCount: number;
  averageTicket: number;
  comparison: PeriodComparison;
  topProducts: TopSellingProduct[];
  /** Total de unidades vendidas no período (todos os itens, não só o top 5) */
  totalUnitsSold: number;
  /** today → hour buckets; 7d/30d → day buckets */
  evolutionGranularity: "hour" | "day";
  evolution: PeriodEvolutionPoint[];
  weekdayPerformance: WeekdayPerformancePoint[];
  highlights: PeriodHighlights;
}

export type DashboardPeriodMetrics = Record<
  DashboardPeriodId,
  DashboardPeriodSnapshot
>;

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  todayRevenue: number;
  todaySales: number;
  weekRevenue: number;
  monthRevenue: number;
  averageTicket: number;
  todayAverageTicket: number;
  monthProfit: number;
  productsSoldMonth: number;
  activeCustomers: number;
  recurringCustomers: number;
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
  stockAlerts: StockAlert[];
  totalCustomers: number;
  newCustomersToday: number;
  topSellingProducts: TopSellingProduct[];
  /** Ranking do dia corrente (vendas completed + isToday local) — used by attention/legacy */
  topSellingProductsToday: TopSellingProduct[];
  /** Period-aware operational metrics (today / 7d / 30d) */
  periodMetrics: DashboardPeriodMetrics;
  topSellingOptions: TopSellingOption[];
  topCustomers: TopCustomer[];
  salesByDay: SalesDayPoint[];
  finance: DashboardFinanceStats;
  financeByDay: CashFlowPoint[];
  dailyGoal: DailyGoalStats;
  comparisons: DashboardComparisons;
  ticketComparison: PeriodComparison;
  productsSoldComparison: PeriodComparison;
  activeCustomersComparison: PeriodComparison;
  recurringCustomersComparison: PeriodComparison;
  profitComparison: PeriodComparison;
  recentSales: RecentSale[];
}
