/**
 * Period analytics derived from already-loaded completed sales.
 * No network I/O — pure functions over sales in a period window.
 *
 * Evolution granularity:
 * - today → local HOUR buckets from first active hour through current hour (zeros filled)
 * - last_7_days → exactly 7 local calendar days (today-6 … today)
 * - last_30_days → exactly 30 local calendar days (today-29 … today)
 *
 * Day buckets only count sales that also fall inside the rolling window.
 */

import type {
  DashboardPeriodId,
  PeriodBestCalendarDay,
  PeriodBestWeekday,
  PeriodEvolutionPoint,
  PeriodHighlights,
  WeekdayPerformancePoint,
} from "../types/dashboard";
import {
  resolveDashboardPeriodWindows,
  startOfLocalDay,
  type DashboardDateRange,
} from "./dashboardPeriods";

export interface AnalyticsSaleRow {
  id: string;
  total: number;
  created_at: string;
}

const WEEKDAY_LABELS_MON_FIRST = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

const MONTH_SHORT_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** Local YYYY-MM-DD — never UTC slice */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Monday-first index: 0=Mon … 6=Sun */
export function toMondayFirstWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function formatLocalDayLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_SHORT_PT[date.getMonth()]}`;
}

export function formatLocalHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}h`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

function formatBestDayLongLabel(date: Date): string {
  const weekday = WEEKDAY_LABELS_MON_FIRST[toMondayFirstWeekdayIndex(date)];
  return `${weekday}, ${date.getDate()} de ${MONTH_SHORT_PT[date.getMonth()].toLowerCase()}`;
}

function emptyWeekdayPerformance(): WeekdayPerformancePoint[] {
  return WEEKDAY_LABELS_MON_FIRST.map((label, weekdayIndex) => ({
    weekdayIndex,
    label,
    revenue: 0,
    salesCount: 0,
    averageTicket: 0,
  }));
}

function averageTicket(revenue: number, salesCount: number): number {
  if (salesCount <= 0) return 0;
  return revenue / salesCount;
}

/**
 * Today: hour buckets from first hour with sales (or current hour if none yet
 * after we know there are sales) through current hour, inclusive, zeros filled.
 * If salesCount is 0, returns [].
 */
export function buildHourlyEvolution(
  sales: AnalyticsSaleRow[],
  now: Date
): PeriodEvolutionPoint[] {
  if (sales.length === 0) return [];

  const currentHour = now.getHours();
  let firstHour = currentHour;

  for (const sale of sales) {
    const hour = new Date(sale.created_at).getHours();
    if (hour < firstHour) firstHour = hour;
  }

  const buckets = new Map<number, { revenue: number; salesCount: number }>();
  for (let hour = firstHour; hour <= currentHour; hour += 1) {
    buckets.set(hour, { revenue: 0, salesCount: 0 });
  }

  for (const sale of sales) {
    const created = new Date(sale.created_at);
    const hour = created.getHours();
    if (hour < firstHour || hour > currentHour) continue;
    const bucket = buckets.get(hour);
    if (!bucket) continue;
    bucket.revenue += Number(sale.total || 0);
    bucket.salesCount += 1;
  }

  const points: PeriodEvolutionPoint[] = [];
  for (let hour = firstHour; hour <= currentHour; hour += 1) {
    const bucket = buckets.get(hour) ?? { revenue: 0, salesCount: 0 };
    points.push({
      key: `h-${hour}`,
      label: formatLocalHourLabel(hour),
      revenue: bucket.revenue,
      salesCount: bucket.salesCount,
      date: null,
      hour,
    });
  }

  return points;
}

/**
 * Exactly `dayCount` local calendar days ending at `now` (inclusive today).
 * Only sales inside `window` contribute to each day.
 */
export function buildDailyEvolution(
  sales: AnalyticsSaleRow[],
  window: DashboardDateRange,
  now: Date,
  dayCount: number
): PeriodEvolutionPoint[] {
  const todayStart = startOfLocalDay(now);
  const points: PeriodEvolutionPoint[] = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const day = new Date(todayStart);
    day.setDate(todayStart.getDate() - offset);
    const dateKey = toLocalDateKey(day);
    points.push({
      key: dateKey,
      label: formatLocalDayLabel(day),
      revenue: 0,
      salesCount: 0,
      date: dateKey,
      hour: null,
    });
  }

  const byDate = new Map(points.map((point) => [point.key, point]));

  for (const sale of sales) {
    const created = new Date(sale.created_at);
    if (
      created.getTime() < window.start.getTime() ||
      created.getTime() > window.end.getTime()
    ) {
      continue;
    }
    const dateKey = toLocalDateKey(created);
    const point = byDate.get(dateKey);
    if (!point) continue;
    point.revenue += Number(sale.total || 0);
    point.salesCount += 1;
  }

  return points;
}

export function buildPeriodEvolution(input: {
  period: DashboardPeriodId;
  sales: AnalyticsSaleRow[];
  now?: Date;
}): { granularity: "hour" | "day"; points: PeriodEvolutionPoint[] } {
  const now = input.now ?? new Date();
  const windows = resolveDashboardPeriodWindows(input.period, now);

  if (input.period === "today") {
    return {
      granularity: "hour",
      points: buildHourlyEvolution(input.sales, now),
    };
  }

  const dayCount = input.period === "last_7_days" ? 7 : 30;
  return {
    granularity: "day",
    points: buildDailyEvolution(input.sales, windows.current, now, dayCount),
  };
}

export function buildWeekdayPerformance(
  sales: AnalyticsSaleRow[]
): WeekdayPerformancePoint[] {
  const points = emptyWeekdayPerformance();

  for (const sale of sales) {
    const created = new Date(sale.created_at);
    const index = toMondayFirstWeekdayIndex(created);
    const point = points[index];
    point.revenue += Number(sale.total || 0);
    point.salesCount += 1;
  }

  for (const point of points) {
    point.averageTicket = averageTicket(point.revenue, point.salesCount);
  }

  return points;
}

export function pickBestWeekday(
  weekdayPerformance: WeekdayPerformancePoint[],
  period: DashboardPeriodId
): PeriodBestWeekday | null {
  if (period === "today") return null;

  const withSales = weekdayPerformance.filter((point) => point.salesCount > 0);
  if (withSales.length === 0) return null;

  const sorted = [...withSales].sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    return a.weekdayIndex - b.weekdayIndex;
  });

  const best = sorted[0];
  const summaryLabel =
    period === "last_30_days"
      ? "Dia com melhor desempenho"
      : "Melhor dia no período";

  return {
    weekdayIndex: best.weekdayIndex,
    label: best.label,
    revenue: best.revenue,
    salesCount: best.salesCount,
    summaryLabel,
  };
}

export function pickBestCalendarDay(
  evolution: PeriodEvolutionPoint[],
  period: DashboardPeriodId
): PeriodBestCalendarDay | null {
  if (period === "today") return null;

  const dayPoints = evolution.filter(
    (point) => point.date && point.salesCount > 0
  );
  if (dayPoints.length === 0) return null;

  const sorted = [...dayPoints].sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    // more recent date wins
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  const best = sorted[0];
  const date = parseLocalDateKey(best.date as string);

  return {
    date: best.date as string,
    label: formatBestDayLongLabel(date),
    revenue: best.revenue,
    salesCount: best.salesCount,
  };
}

export function buildPeriodHighlights(input: {
  period: DashboardPeriodId;
  weekdayPerformance: WeekdayPerformancePoint[];
  evolution: PeriodEvolutionPoint[];
}): PeriodHighlights {
  return {
    bestWeekday: pickBestWeekday(input.weekdayPerformance, input.period),
    bestCalendarDay: pickBestCalendarDay(input.evolution, input.period),
  };
}

export function buildPeriodAnalytics(input: {
  period: DashboardPeriodId;
  sales: AnalyticsSaleRow[];
  now?: Date;
}): {
  evolutionGranularity: "hour" | "day";
  evolution: PeriodEvolutionPoint[];
  weekdayPerformance: WeekdayPerformancePoint[];
  highlights: PeriodHighlights;
} {
  const evolution = buildPeriodEvolution(input);
  const weekdayPerformance = buildWeekdayPerformance(input.sales);
  const highlights = buildPeriodHighlights({
    period: input.period,
    weekdayPerformance,
    evolution: evolution.points,
  });

  return {
    evolutionGranularity: evolution.granularity,
    evolution: evolution.points,
    weekdayPerformance,
    highlights,
  };
}

export { WEEKDAY_LABELS_MON_FIRST };
