import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import { dashboardService } from "../services/dashboard.service";
import type {
  DashboardPeriodMetrics,
  DashboardStats,
  PeriodComparison,
} from "../types/dashboard";
import { buildSalesByDay } from "../utils/dashboardAggregations";
import {
  DASHBOARD_PERIOD_OPTIONS,
  resolveDashboardPeriodWindows,
} from "../utils/dashboardPeriods";

const EMPTY_COMPARISON: PeriodComparison = {
  current: 0,
  previous: 0,
  changePercent: 0,
  trend: "neutral",
  hasComparableHistory: false,
};

function emptyPeriodMetrics(): DashboardPeriodMetrics {
  const now = new Date();
  const metrics = {} as DashboardPeriodMetrics;

  for (const option of DASHBOARD_PERIOD_OPTIONS) {
    const windows = resolveDashboardPeriodWindows(option.id, now);
    metrics[option.id] = {
      period: option.id,
      label: windows.label,
      shortLabel: windows.shortLabel,
      comparisonHint: windows.comparisonHint,
      revenue: 0,
      salesCount: 0,
      averageTicket: 0,
      comparison: { ...EMPTY_COMPARISON },
      topProducts: [],
      totalUnitsSold: 0,
      evolutionGranularity: option.id === "today" ? "hour" : "day",
      evolution: [],
      weekdayPerformance: [
        { weekdayIndex: 0, label: "Segunda", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 1, label: "Terça", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 2, label: "Quarta", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 3, label: "Quinta", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 4, label: "Sexta", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 5, label: "Sábado", revenue: 0, salesCount: 0, averageTicket: 0 },
        { weekdayIndex: 6, label: "Domingo", revenue: 0, salesCount: 0, averageTicket: 0 },
      ],
      highlights: { bestWeekday: null, bestCalendarDay: null },
    };
  }

  return metrics;
}

const EMPTY_STATS: DashboardStats = {
  totalRevenue: 0,
  totalSales: 0,
  todayRevenue: 0,
  todaySales: 0,
  weekRevenue: 0,
  monthRevenue: 0,
  averageTicket: 0,
  todayAverageTicket: 0,
  monthProfit: 0,
  productsSoldMonth: 0,
  activeCustomers: 0,
  recurringCustomers: 0,
  totalProducts: 0,
  activeProducts: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  totalStockUnits: 0,
  stockAlerts: [],
  totalCustomers: 0,
  newCustomersToday: 0,
  topSellingProducts: [],
  topSellingProductsToday: [],
  periodMetrics: emptyPeriodMetrics(),
  topSellingOptions: [],
  topCustomers: [],
  salesByDay: buildSalesByDay([]),
  finance: {
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
    balance: 0,
    incomeToday: 0,
    expensesToday: 0,
    profitToday: 0,
  },
  financeByDay: [],
  dailyGoal: {
    target: 0,
    current: 0,
    progressPercent: 0,
  },
  comparisons: {
    revenueTodayVsYesterday: { ...EMPTY_COMPARISON },
    revenueWeekVsPreviousWeek: { ...EMPTY_COMPARISON },
    revenueMonthVsPreviousMonth: { ...EMPTY_COMPARISON },
  },
  ticketComparison: { ...EMPTY_COMPARISON },
  productsSoldComparison: { ...EMPTY_COMPARISON },
  activeCustomersComparison: { ...EMPTY_COMPARISON },
  recurringCustomersComparison: { ...EMPTY_COMPARISON },
  profitComparison: { ...EMPTY_COMPARISON },
  recentSales: [],
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const reload = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();
      setStats(data);
      hasLoadedRef.current = true;
    } catch (err) {
      logger.error("Erro ao buscar indicadores:", err);
      setError("Não foi possível carregar os dados da operação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return onDataChanged(reload);
  }, [reload]);

  return {
    stats,
    loading,
    error,
    reload,
  };
}
