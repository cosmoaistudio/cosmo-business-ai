import type { Product } from "@/features/products";
import { resolveProductImage } from "@/features/products/utils/productImage";
import type { FinancialTransaction } from "@/features/finance/types/finance";
import {
  buildCashFlow,
  computeFinanceStats,
} from "@/features/finance/utils/financeStats";
import { isSameLocalDay } from "@/lib/date";
import type {
  DashboardComparisons,
  DashboardPeriodId,
  DashboardPeriodMetrics,
  DashboardPeriodSnapshot,
  DashboardStats,
  PeriodComparison,
  RecentSale,
  SalesDayPoint,
  TopCustomer,
  TopSellingOption,
  TopSellingProduct,
} from "../types/dashboard";
import {
  DASHBOARD_PERIOD_OPTIONS,
  isDateInRange,
  resolveDashboardPeriodWindows,
  startOfLocalDay,
} from "./dashboardPeriods";
import { buildPeriodAnalytics } from "./dashboardPeriodAnalytics";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface SaleRow {
  id: string;
  sale_number?: number | null;
  customer_id?: string | null;
  total: number;
  created_at: string;
}

interface SaleItemRow {
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
}

interface SaleItemOptionRow {
  sale_id: string;
  option_id: string;
  option_name: string;
  quantity: number;
  subtotal: number;
}

function formatDayLabel(date: Date) {
  return DAY_LABELS[date.getDay()];
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Same calendar-day window as `now`: from start of that day until the same clock time.
 * Keeps today-so-far comparable to an equivalent slice of yesterday.
 */
export function filterSalesInSameHourWindow(
  sales: SaleRow[],
  dayStart: Date,
  now: Date
): SaleRow[] {
  const elapsedMs = Math.max(
    0,
    now.getTime() - startOfLocalDay(now).getTime()
  );
  const windowEnd = new Date(dayStart.getTime() + elapsedMs);

  return sales.filter((sale) => {
    const created = new Date(sale.created_at);
    return created >= dayStart && created <= windowEnd;
  });
}

function getWeekStart(reference = new Date()) {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function isInWeekContaining(dateString: string, weekStart: Date) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const date = new Date(dateString);
  return date >= start && date <= end;
}

function isInCalendarMonth(dateString: string, year: number, month: number) {
  const date = new Date(dateString);
  return date.getFullYear() === year && date.getMonth() === month;
}

function sumRevenue(sales: SaleRow[]) {
  return sales.reduce((sum, sale) => sum + Number(sale.total), 0);
}

function sumByTransactionType(
  transactions: FinancialTransaction[],
  type: FinancialTransaction["type"]
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function sumProfitInMonth(
  transactions: FinancialTransaction[],
  year: number,
  month: number
) {
  const monthTransactions = transactions.filter((transaction) =>
    isInCalendarMonth(transaction.transaction_date, year, month)
  );
  const income = sumByTransactionType(monthTransactions, "income");
  const expenses = sumByTransactionType(monthTransactions, "expense");
  return income - expenses;
}

function sumProductsSoldInMonth(
  items: SaleItemRow[],
  sales: SaleRow[],
  year: number,
  month: number
) {
  const monthSaleIds = new Set(
    sales
      .filter((sale) => isInCalendarMonth(sale.created_at, year, month))
      .map((sale) => sale.id)
  );

  return items
    .filter((item) => monthSaleIds.has(item.sale_id))
    .reduce((sum, item) => sum + item.quantity, 0);
}

function countActiveCustomersInRange(
  sales: SaleRow[],
  start: Date,
  end: Date
) {
  const customerIds = new Set<string>();

  for (const sale of sales) {
    if (!sale.customer_id) continue;

    const date = new Date(sale.created_at);
    if (date >= start && date <= end) {
      customerIds.add(sale.customer_id);
    }
  }

  return customerIds.size;
}

function countRecurringCustomersInRange(
  sales: SaleRow[],
  start: Date,
  end: Date,
  minPurchases = 2
) {
  const purchaseCounts = new Map<string, number>();

  for (const sale of sales) {
    if (!sale.customer_id) continue;

    const date = new Date(sale.created_at);
    if (date >= start && date <= end) {
      purchaseCounts.set(
        sale.customer_id,
        (purchaseCounts.get(sale.customer_id) ?? 0) + 1
      );
    }
  }

  return [...purchaseCounts.values()].filter(
    (count) => count >= minPurchases
  ).length;
}

export function computeDailyGoal(
  salesByDay: SalesDayPoint[],
  todayRevenue: number
) {
  const historicalDays = salesByDay.slice(0, -1);
  const daysWithRevenue = historicalDays.filter((day) => day.revenue > 0);
  const averageRevenue =
    daysWithRevenue.length > 0
      ? daysWithRevenue.reduce((sum, day) => sum + day.revenue, 0) /
        daysWithRevenue.length
      : 0;

  const target =
    averageRevenue > 0
      ? averageRevenue * 1.05
      : todayRevenue > 0
        ? todayRevenue
        : 0;

  const progressPercent =
    target > 0 ? (todayRevenue / target) * 100 : todayRevenue > 0 ? 100 : 0;

  return {
    target,
    current: todayRevenue,
    progressPercent,
  };
}

export function buildComparison(
  current: number,
  previous: number
): PeriodComparison {
  if (previous <= 0) {
    return {
      current,
      previous,
      changePercent: 0,
      trend: current > 0 ? "up" : "neutral",
      hasComparableHistory: false,
    };
  }

  const changePercent = ((current - previous) / previous) * 100;

  return {
    current,
    previous,
    changePercent: Math.round(changePercent * 10) / 10,
    trend:
      changePercent > 0.5 ? "up" : changePercent < -0.5 ? "down" : "neutral",
    hasComparableHistory: true,
  };
}

export function buildSalesByDay(
  sales: SaleRow[],
  days = 7,
  reference = new Date()
): SalesDayPoint[] {
  const points: SalesDayPoint[] = [];
  const today = startOfLocalDay(reference);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const dateKey = toDateKey(date);
    const daySales = sales.filter(
      (sale) => toDateKey(new Date(sale.created_at)) === dateKey
    );

    points.push({
      date: dateKey,
      label: formatDayLabel(date),
      revenue: daySales.reduce((sum, sale) => sum + Number(sale.total), 0),
      salesCount: daySales.length,
    });
  }

  return points;
}

export function buildTopSellingProducts(
  items: SaleItemRow[],
  limit = 5
): TopSellingProduct[] {
  const grouped = new Map<string, TopSellingProduct>();

  for (const item of items) {
    const key = item.product_id || item.product_name;
    const existing = grouped.get(key);

    if (existing) {
      existing.totalQuantity += Number(item.quantity || 0);
      existing.totalRevenue += Number(item.subtotal || 0);
      continue;
    }

    grouped.set(key, {
      productId: item.product_id || key,
      productName: item.product_name,
      totalQuantity: Number(item.quantity || 0),
      totalRevenue: Number(item.subtotal || 0),
    });
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      if (b.totalRevenue !== a.totalRevenue) {
        return b.totalRevenue - a.totalRevenue;
      }
      return a.productName.localeCompare(b.productName, "pt-BR");
    })
    .slice(0, limit);
}

export function buildTopSellingOptions(
  items: SaleItemOptionRow[],
  limit = 5
): TopSellingOption[] {
  const grouped = new Map<string, TopSellingOption>();

  for (const item of items) {
    const existing = grouped.get(item.option_id);

    if (existing) {
      existing.totalQuantity += item.quantity;
      existing.totalRevenue += Number(item.subtotal);
      continue;
    }

    grouped.set(item.option_id, {
      optionId: item.option_id,
      optionName: item.option_name,
      totalQuantity: item.quantity,
      totalRevenue: Number(item.subtotal),
    });
  }

  return [...grouped.values()]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

export function computeAverageTicket(revenue: number, salesCount: number) {
  if (salesCount === 0) return 0;
  return revenue / salesCount;
}

export function filterSalesInRange(
  sales: SaleRow[],
  range: { start: Date; end: Date }
): SaleRow[] {
  return sales.filter((sale) => isDateInRange(sale.created_at, range));
}

/**
 * Period snapshot from already-scoped completed sales (no extra queries).
 */
export function buildPeriodSnapshot(input: {
  period: DashboardPeriodId;
  sales: SaleRow[];
  saleItems: SaleItemRow[];
  now?: Date;
  enrichProduct?: (product: TopSellingProduct) => TopSellingProduct;
}): DashboardPeriodSnapshot {
  const now = input.now ?? new Date();
  const windows = resolveDashboardPeriodWindows(input.period, now);
  const currentSales = filterSalesInRange(input.sales, windows.current);
  const previousSales = filterSalesInRange(input.sales, windows.previous);
  const revenue = sumRevenue(currentSales);
  const salesCount = currentSales.length;
  const currentIds = new Set(currentSales.map((sale) => sale.id));
  const periodItems = input.saleItems.filter((item) =>
    currentIds.has(item.sale_id)
  );
  const enrich = input.enrichProduct ?? ((product: TopSellingProduct) => product);
  const analytics = buildPeriodAnalytics({
    period: input.period,
    sales: currentSales,
    now,
  });
  const totalUnitsSold = periodItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return {
    period: input.period,
    label: windows.label,
    shortLabel: windows.shortLabel,
    comparisonHint: windows.comparisonHint,
    revenue,
    salesCount,
    averageTicket: computeAverageTicket(revenue, salesCount),
    comparison: buildComparison(revenue, sumRevenue(previousSales)),
    topProducts: buildTopSellingProducts(periodItems).map(enrich),
    totalUnitsSold,
    evolutionGranularity: analytics.evolutionGranularity,
    evolution: analytics.evolution,
    weekdayPerformance: analytics.weekdayPerformance,
    highlights: analytics.highlights,
  };
}

export function buildAllPeriodMetrics(input: {
  sales: SaleRow[];
  saleItems: SaleItemRow[];
  now?: Date;
  enrichProduct?: (product: TopSellingProduct) => TopSellingProduct;
}): DashboardPeriodMetrics {
  const now = input.now ?? new Date();
  const metrics = {} as DashboardPeriodMetrics;

  for (const option of DASHBOARD_PERIOD_OPTIONS) {
    metrics[option.id] = buildPeriodSnapshot({
      period: option.id,
      sales: input.sales,
      saleItems: input.saleItems,
      now,
      enrichProduct: input.enrichProduct,
    });
  }

  return metrics;
}

export function buildTopCustomers(
  sales: SaleRow[],
  customerNames: Map<string, string>,
  limit = 5
): TopCustomer[] {
  const grouped = new Map<string, TopCustomer>();

  for (const sale of sales) {
    if (!sale.customer_id) continue;

    const customerName =
      customerNames.get(sale.customer_id) ?? "Cliente sem nome";
    const existing = grouped.get(sale.customer_id);

    if (existing) {
      existing.purchaseCount += 1;
      existing.totalSpent += Number(sale.total);

      if (sale.created_at > existing.lastPurchaseAt) {
        existing.lastPurchaseAt = sale.created_at;
      }

      continue;
    }

    grouped.set(sale.customer_id, {
      customerId: sale.customer_id,
      customerName,
      purchaseCount: 1,
      totalSpent: Number(sale.total),
      lastPurchaseAt: sale.created_at,
    });
  }

  return [...grouped.values()]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export function buildRecentSales(
  sales: SaleRow[],
  customerNames: Map<string, string>,
  limit = 8
): RecentSale[] {
  return [...sales]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((sale) => ({
      id: sale.id,
      saleNumber: sale.sale_number ?? 0,
      total: Number(sale.total),
      createdAt: sale.created_at,
      customerName: sale.customer_id
        ? (customerNames.get(sale.customer_id) ?? null)
        : null,
    }));
}

function buildComparisons(
  sales: SaleRow[],
  now = new Date()
): DashboardComparisons {
  const todayStart = startOfLocalDay(now);
  const yesterdayStart = startOfLocalDay(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const todayWindowRevenue = sumRevenue(
    filterSalesInSameHourWindow(sales, todayStart, now)
  );
  const yesterdayWindowRevenue = sumRevenue(
    filterSalesInSameHourWindow(sales, yesterdayStart, now)
  );

  const currentWeekStart = getWeekStart(now);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const weekRevenue = sumRevenue(
    sales.filter((sale) => isInWeekContaining(sale.created_at, currentWeekStart))
  );
  const previousWeekRevenue = sumRevenue(
    sales.filter((sale) =>
      isInWeekContaining(sale.created_at, previousWeekStart)
    )
  );

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = previousMonthDate.getMonth();

  const monthRevenue = sumRevenue(
    sales.filter((sale) =>
      isInCalendarMonth(sale.created_at, currentYear, currentMonth)
    )
  );
  const previousMonthRevenue = sumRevenue(
    sales.filter((sale) =>
      isInCalendarMonth(sale.created_at, previousYear, previousMonth)
    )
  );

  return {
    revenueTodayVsYesterday: buildComparison(
      todayWindowRevenue,
      yesterdayWindowRevenue
    ),
    revenueWeekVsPreviousWeek: buildComparison(weekRevenue, previousWeekRevenue),
    revenueMonthVsPreviousMonth: buildComparison(
      monthRevenue,
      previousMonthRevenue
    ),
  };
}

export function buildDashboardMetrics(input: {
  sales: SaleRow[];
  products: Product[];
  stockAlerts: DashboardStats["stockAlerts"];
  totalCustomers: number;
  newCustomersToday: number;
  saleItems: SaleItemRow[];
  saleItemOptions: SaleItemOptionRow[];
  financialTransactions: FinancialTransaction[];
  customerNames: Map<string, string>;
  now?: Date;
}): DashboardStats {
  const {
    sales,
    products,
    stockAlerts,
    totalCustomers,
    newCustomersToday,
    saleItems,
    saleItemOptions,
    financialTransactions,
    customerNames,
    now = new Date(),
  } = input;

  const finance = computeFinanceStats(financialTransactions);
  const comparisons = buildComparisons(sales, now);

  const totalRevenue = sumRevenue(sales);
  const todaySalesData = sales.filter((sale) =>
    isSameLocalDay(sale.created_at, now)
  );
  const todayRevenue = sumRevenue(todaySalesData);
  const weekRevenue = comparisons.revenueWeekVsPreviousWeek.current;
  const monthRevenue = comparisons.revenueMonthVsPreviousMonth.current;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = previousMonthDate.getMonth();

  const monthProfit = sumProfitInMonth(
    financialTransactions,
    currentYear,
    currentMonth
  );
  const previousMonthProfit = sumProfitInMonth(
    financialTransactions,
    previousYear,
    previousMonth
  );

  const productsSoldMonth = sumProductsSoldInMonth(
    saleItems,
    sales,
    currentYear,
    currentMonth
  );
  const previousProductsSoldMonth = sumProductsSoldInMonth(
    saleItems,
    sales,
    previousYear,
    previousMonth
  );

  const activeRangeEnd = new Date(now);
  const activeRangeStart = new Date(now);
  activeRangeStart.setDate(activeRangeStart.getDate() - 30);
  const previousActiveRangeEnd = new Date(activeRangeStart);
  const previousActiveRangeStart = new Date(now);
  previousActiveRangeStart.setDate(previousActiveRangeStart.getDate() - 60);

  const activeCustomers = countActiveCustomersInRange(
    sales,
    activeRangeStart,
    activeRangeEnd
  );
  const previousActiveCustomers = countActiveCustomersInRange(
    sales,
    previousActiveRangeStart,
    previousActiveRangeEnd
  );

  const recurringRangeEnd = new Date(now);
  const recurringRangeStart = new Date(now);
  recurringRangeStart.setDate(recurringRangeStart.getDate() - 90);
  const previousRecurringRangeEnd = new Date(recurringRangeStart);
  const previousRecurringRangeStart = new Date(now);
  previousRecurringRangeStart.setDate(
    previousRecurringRangeStart.getDate() - 180
  );

  const recurringCustomers = countRecurringCustomersInRange(
    sales,
    recurringRangeStart,
    recurringRangeEnd
  );
  const previousRecurringCustomers = countRecurringCustomersInRange(
    sales,
    previousRecurringRangeStart,
    previousRecurringRangeEnd
  );

  const todayStart = startOfLocalDay(now);
  const yesterdayStart = startOfLocalDay(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const todayWindowSales = filterSalesInSameHourWindow(sales, todayStart, now);
  const yesterdayWindowSales = filterSalesInSameHourWindow(
    sales,
    yesterdayStart,
    now
  );
  const todaySaleIds = new Set(todaySalesData.map((sale) => sale.id));
  const todaySaleItems = saleItems.filter((item) =>
    todaySaleIds.has(item.sale_id)
  );
  const enrichTopProduct = (item: TopSellingProduct): TopSellingProduct => ({
    ...item,
    image:
      resolveProductImage(
        products.find((product) => product.id === item.productId) ?? {}
      ) || null,
  });
  const salesByDay = buildSalesByDay(sales, 7, now);
  const periodMetrics = buildAllPeriodMetrics({
    sales,
    saleItems,
    now,
    enrichProduct: enrichTopProduct,
  });

  return {
    totalRevenue,
    totalSales: sales.length,
    todayRevenue,
    todaySales: todaySalesData.length,
    weekRevenue,
    monthRevenue,
    averageTicket: computeAverageTicket(totalRevenue, sales.length),
    todayAverageTicket: computeAverageTicket(
      todayRevenue,
      todaySalesData.length
    ),
    monthProfit,
    productsSoldMonth,
    activeCustomers,
    recurringCustomers,
    totalProducts: products.length,
    activeProducts: products.filter((product) => product.status === "active")
      .length,
    lowStockCount: stockAlerts.length,
    outOfStockCount: products.filter((product) => product.stock === 0).length,
    totalStockUnits: products.reduce(
      (sum, product) => sum + product.stock,
      0
    ),
    stockAlerts: stockAlerts.slice(0, 5),
    totalCustomers,
    newCustomersToday,
    topSellingProducts: buildTopSellingProducts(saleItems).map(enrichTopProduct),
    topSellingProductsToday:
      buildTopSellingProducts(todaySaleItems).map(enrichTopProduct),
    periodMetrics,
    topSellingOptions: buildTopSellingOptions(saleItemOptions),
    topCustomers: buildTopCustomers(sales, customerNames),
    salesByDay,
    finance: {
      totalIncome: finance.totalIncome,
      totalExpenses: finance.totalExpenses,
      profit: finance.profit,
      balance: finance.balance,
      incomeToday: finance.incomeToday,
      expensesToday: finance.expensesToday,
      profitToday: finance.profitToday,
    },
    financeByDay: buildCashFlow(financialTransactions),
    dailyGoal: computeDailyGoal(salesByDay, todayRevenue),
    comparisons,
    ticketComparison: buildComparison(
      computeAverageTicket(
        sumRevenue(todayWindowSales),
        todayWindowSales.length
      ),
      computeAverageTicket(
        sumRevenue(yesterdayWindowSales),
        yesterdayWindowSales.length
      )
    ),
    productsSoldComparison: buildComparison(
      productsSoldMonth,
      previousProductsSoldMonth
    ),
    activeCustomersComparison: buildComparison(
      activeCustomers,
      previousActiveCustomers
    ),
    recurringCustomersComparison: buildComparison(
      recurringCustomers,
      previousRecurringCustomers
    ),
    profitComparison: buildComparison(monthProfit, previousMonthProfit),
    recentSales: buildRecentSales(sales, customerNames),
  };
}
