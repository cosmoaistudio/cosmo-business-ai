/**
 * Deterministic period insights from already-aggregated DashboardPeriodSnapshot.
 * No network I/O. No AI. Every insight must be justified by evidence numbers.
 *
 * Thresholds (conservative — avoid celebrating/alarming 1% noise):
 * - growth: >= +10% with comparable history
 * - decline (attention): <= -15%
 * - decline (info): <= -8% and > -15%
 * - product concentration: leader share >= 25% of units
 * - recent trend: only when full equal-length day blocks exist
 */

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type {
  DashboardPeriodSnapshot,
  PeriodEvolutionPoint,
} from "../types/dashboard";
import { buildComparison } from "./dashboardAggregations";

export type DashboardInsightTone = "positive" | "attention" | "info";

export type DashboardInsightCategory =
  | "growth"
  | "decline"
  | "trend"
  | "concentration"
  | "product"
  | "calendar"
  | "weekday";

export type DashboardInsightId =
  | "revenue_growth"
  | "revenue_decline_significant"
  | "revenue_decline_mild"
  | "recent_trend_up"
  | "recent_trend_down"
  | "product_concentration"
  | "top_product"
  | "best_calendar_day"
  | "best_weekday";

export interface DashboardInsight {
  id: DashboardInsightId;
  tone: DashboardInsightTone;
  category: DashboardInsightCategory;
  title: string;
  description: string;
  evidence: Record<string, number | string | boolean>;
  /** Lower = higher priority */
  rank: number;
}

export const INSIGHT_THRESHOLDS = {
  /** Minimum positive % vs previous period to surface growth */
  significantGrowthPercent: 10,
  /** Mild decline (informative), not critical */
  mildDeclinePercent: 8,
  /** Significant decline (attention) */
  significantDeclinePercent: 15,
  /** Leader units / total units */
  topProductSharePercent: 25,
  /** Recent trend block sizes by period */
  trendBlockDays7: 3,
  trendBlockDays30: 7,
  maxInsights: 3,
} as const;

const THEME_BY_CATEGORY: Record<DashboardInsightCategory, string> = {
  growth: "revenue_direction",
  decline: "revenue_direction",
  trend: "revenue_direction",
  concentration: "product_focus",
  product: "product_focus",
  calendar: "calendar_peak",
  weekday: "weekday_peak",
};

function sumEvolutionRevenue(
  points: PeriodEvolutionPoint[],
  start: number,
  endExclusive: number
): number {
  let sum = 0;
  for (let i = start; i < endExclusive; i += 1) {
    sum += Number(points[i]?.revenue || 0);
  }
  return sum;
}

function buildGrowthInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  const { comparison } = snapshot;
  if (!comparison.hasComparableHistory) return null;
  if (comparison.changePercent < INSIGHT_THRESHOLDS.significantGrowthPercent) {
    return null;
  }

  return {
    id: "revenue_growth",
    tone: "positive",
    category: "growth",
    title: "Faturamento em crescimento",
    description: `Você faturou ${formatPercent(comparison.changePercent)} a mais que no período anterior.`,
    evidence: {
      currentRevenue: comparison.current,
      previousRevenue: comparison.previous,
      changePercent: comparison.changePercent,
    },
    rank: 2,
  };
}

function buildDeclineInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  const { comparison } = snapshot;
  if (!comparison.hasComparableHistory) return null;
  if (comparison.changePercent >= 0) return null;

  const drop = Math.abs(comparison.changePercent);

  if (drop >= INSIGHT_THRESHOLDS.significantDeclinePercent) {
    return {
      id: "revenue_decline_significant",
      tone: "attention",
      category: "decline",
      title: "Faturamento abaixo do período anterior",
                description: `Seu faturamento ficou ${Math.round(drop)}% menor que no período anterior.`,
      evidence: {
        currentRevenue: comparison.current,
        previousRevenue: comparison.previous,
        changePercent: comparison.changePercent,
        severity: "significant",
      },
      rank: 1,
    };
  }

  if (drop >= INSIGHT_THRESHOLDS.mildDeclinePercent) {
    return {
      id: "revenue_decline_mild",
      tone: "info",
      category: "decline",
      title: "Faturamento um pouco abaixo do período anterior",
      description: `Houve uma redução de ${Math.round(drop)}% frente ao período anterior.`,
      evidence: {
        currentRevenue: comparison.current,
        previousRevenue: comparison.previous,
        changePercent: comparison.changePercent,
        severity: "mild",
      },
      rank: 7,
    };
  }

  return null;
}

function buildTopProductInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  const top = snapshot.topProducts[0];
  if (!top || top.totalQuantity <= 0) return null;

  return {
    id: "top_product",
    tone: "info",
    category: "product",
    title: `Seu produto mais vendido foi ${top.productName}`,
    description: `${formatNumber(top.totalQuantity)} unidade${top.totalQuantity === 1 ? "" : "s"} vendida${top.totalQuantity === 1 ? "" : "s"} no período.`,
    evidence: {
      productId: top.productId,
      productName: top.productName,
      totalQuantity: top.totalQuantity,
      totalRevenue: top.totalRevenue,
    },
    rank: 5,
  };
}

function buildConcentrationInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  const top = snapshot.topProducts[0];
  if (!top || top.totalQuantity <= 0) return null;

  const totalUnits = snapshot.topProducts.reduce(
    (sum, product) => sum + Number(product.totalQuantity || 0),
    0
  );
  if (totalUnits <= 0) return null;

  const sharePercent = (top.totalQuantity / totalUnits) * 100;
  if (sharePercent < INSIGHT_THRESHOLDS.topProductSharePercent) return null;

  const rounded = Math.round(sharePercent);

  return {
    id: "product_concentration",
    tone: "info",
    category: "concentration",
    title: "Vendas concentradas em um produto",
    description: `${rounded}% das unidades vendidas foram de ${top.productName}.`,
    evidence: {
      productName: top.productName,
      topProductQuantity: top.totalQuantity,
      totalUnitsSold: totalUnits,
      sharePercent: rounded,
      threshold: INSIGHT_THRESHOLDS.topProductSharePercent,
    },
    rank: 4,
  };
}

function buildBestCalendarDayInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  if (snapshot.period === "today") return null;
  const best = snapshot.highlights.bestCalendarDay;
  if (!best || best.salesCount <= 0) return null;

  return {
    id: "best_calendar_day",
    tone: "positive",
    category: "calendar",
    title: `Seu melhor dia foi ${best.label}`,
    description: `${formatCurrency(best.revenue)} em vendas.`,
    evidence: {
      date: best.date,
      label: best.label,
      revenue: best.revenue,
      salesCount: best.salesCount,
    },
    rank: 6,
  };
}

function buildBestWeekdayInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  // Prefer 30d sample — 7d is too short to claim weekday pattern
  if (snapshot.period !== "last_30_days") return null;
  const best = snapshot.highlights.bestWeekday;
  if (!best || best.salesCount <= 0) return null;

  return {
    id: "best_weekday",
    tone: "info",
    category: "weekday",
    title: `${best.label} teve o melhor desempenho no período`,
    description: `${formatCurrency(best.revenue)} · ${formatNumber(best.salesCount)} venda(s).`,
    evidence: {
      weekdayIndex: best.weekdayIndex,
      label: best.label,
      revenue: best.revenue,
      salesCount: best.salesCount,
    },
    rank: 7,
  };
}

/**
 * Recent trend using equal-length day blocks from evolution series.
 * today (hour) → skipped (no reliable equal blocks without extra rules).
 */
export function buildRecentTrendInsight(
  snapshot: DashboardPeriodSnapshot
): DashboardInsight | null {
  if (snapshot.evolutionGranularity !== "day") return null;
  if (snapshot.period === "today") return null;

  const blockSize =
    snapshot.period === "last_30_days"
      ? INSIGHT_THRESHOLDS.trendBlockDays30
      : INSIGHT_THRESHOLDS.trendBlockDays7;

  const points = snapshot.evolution;
  if (points.length < blockSize * 2) return null;

  const recentStart = points.length - blockSize;
  const previousStart = points.length - blockSize * 2;
  const recentRevenue = sumEvolutionRevenue(
    points,
    recentStart,
    points.length
  );
  const previousRevenue = sumEvolutionRevenue(
    points,
    previousStart,
    recentStart
  );

  const comparison = buildComparison(recentRevenue, previousRevenue);
  if (!comparison.hasComparableHistory) return null;

  if (comparison.changePercent >= INSIGHT_THRESHOLDS.significantGrowthPercent) {
    return {
      id: "recent_trend_up",
      tone: "positive",
      category: "trend",
      title: "Tendência recente de alta",
      description: `Nos últimos ${blockSize} dias o faturamento ficou ${formatPercent(comparison.changePercent)} acima dos ${blockSize} dias anteriores.`,
      evidence: {
        blockSize,
        recentRevenue,
        previousRevenue,
        changePercent: comparison.changePercent,
      },
      rank: 3,
    };
  }

  if (
    comparison.changePercent <= -INSIGHT_THRESHOLDS.significantDeclinePercent
  ) {
    return {
      id: "recent_trend_down",
      tone: "attention",
      category: "trend",
      title: "Tendência recente de queda",
      description: `Nos últimos ${blockSize} dias o faturamento ficou ${formatPercent(comparison.changePercent)} abaixo dos ${blockSize} dias anteriores.`,
      evidence: {
        blockSize,
        recentRevenue,
        previousRevenue,
        changePercent: comparison.changePercent,
      },
      rank: 3,
    };
  }

  return null;
}

function dedupeByTheme(insights: DashboardInsight[]): DashboardInsight[] {
  const seen = new Set<string>();
  const result: DashboardInsight[] = [];

  for (const insight of insights) {
    const theme = THEME_BY_CATEGORY[insight.category];
    if (seen.has(theme)) continue;
    seen.add(theme);
    result.push(insight);
  }

  return result;
}

/**
 * Build up to INSIGHT_THRESHOLDS.maxInsights deterministic insights.
 * Returns [] when there is nothing meaningful to say.
 */
export function buildDashboardPeriodInsights(
  snapshot: DashboardPeriodSnapshot | null | undefined
): DashboardInsight[] {
  if (!snapshot) return [];
  if (snapshot.salesCount <= 0 && snapshot.revenue <= 0) {
    // Still allow comparison-based insights only if comparison has history —
    // but zero sales usually means empty period → no insights.
    if (!snapshot.comparison.hasComparableHistory) return [];
  }

  const candidates = [
    buildDeclineInsight(snapshot),
    buildGrowthInsight(snapshot),
    buildRecentTrendInsight(snapshot),
    buildConcentrationInsight(snapshot),
    buildTopProductInsight(snapshot),
    buildBestCalendarDayInsight(snapshot),
    buildBestWeekdayInsight(snapshot),
  ].filter((insight): insight is DashboardInsight => insight !== null);

  const sorted = [...candidates].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.id.localeCompare(b.id);
  });

  return dedupeByTheme(sorted).slice(0, INSIGHT_THRESHOLDS.maxInsights);
}
