/**
 * Single source of truth for Dashboard analysis periods.
 *
 * Choice: **rolling windows** anchored at `now` (not calendar weeks/months).
 * This keeps current vs previous ranges the same duration for fair comparison.
 *
 * - today: local calendar day from 00:00 → now; previous = yesterday 00:00 → same elapsed clock
 * - last_7_days / last_30_days: exactly N*24h ending at now; previous = the N*24h before that
 */

export type DashboardPeriodId = "today" | "last_7_days" | "last_30_days";

export interface DashboardDateRange {
  start: Date;
  end: Date;
}

export interface DashboardPeriodWindows {
  id: DashboardPeriodId;
  label: string;
  shortLabel: string;
  current: DashboardDateRange;
  previous: DashboardDateRange;
  comparisonHint: string;
}

export const DASHBOARD_PERIOD_OPTIONS: ReadonlyArray<{
  id: DashboardPeriodId;
  label: string;
  shortLabel: string;
}> = [
  { id: "today", label: "Hoje", shortLabel: "Hoje" },
  { id: "last_7_days", label: "Últimos 7 dias", shortLabel: "7 dias" },
  { id: "last_30_days", label: "Últimos 30 dias", shortLabel: "30 dias" },
] as const;

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriodId = "today";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfLocalDay(reference = new Date()) {
  const date = new Date(reference);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Inclusive range check: start <= created_at <= end
 */
export function isDateInRange(
  dateString: string,
  range: DashboardDateRange
): boolean {
  const time = new Date(dateString).getTime();
  return time >= range.start.getTime() && time <= range.end.getTime();
}

export function resolveDashboardPeriodWindows(
  period: DashboardPeriodId,
  now = new Date()
): DashboardPeriodWindows {
  const end = new Date(now);

  if (period === "today") {
    const currentStart = startOfLocalDay(now);
    const previousStart = startOfLocalDay(now);
    previousStart.setDate(previousStart.getDate() - 1);
    const elapsedMs = Math.max(0, end.getTime() - currentStart.getTime());
    const previousEnd = new Date(previousStart.getTime() + elapsedMs);

    return {
      id: period,
      label: "Hoje",
      shortLabel: "Hoje",
      current: { start: currentStart, end },
      previous: { start: previousStart, end: previousEnd },
      comparisonHint: "Comparado ao mesmo horário de ontem",
    };
  }

  const days = period === "last_7_days" ? 7 : 30;
  const windowMs = days * MS_PER_DAY;
  const currentStart = new Date(end.getTime() - windowMs);
  const previousEnd = new Date(currentStart.getTime());
  const previousStart = new Date(currentStart.getTime() - windowMs);
  const option = DASHBOARD_PERIOD_OPTIONS.find((item) => item.id === period);

  return {
    id: period,
    label: option?.label ?? `${days} dias`,
    shortLabel: option?.shortLabel ?? `${days}d`,
    current: { start: currentStart, end },
    previous: { start: previousStart, end: previousEnd },
    comparisonHint: `Comparado aos ${days} dias anteriores`,
  };
}
