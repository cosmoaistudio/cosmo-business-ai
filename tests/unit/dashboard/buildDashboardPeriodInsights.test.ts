import { describe, expect, it } from "vitest";
import {
  buildDashboardPeriodInsights,
  buildRecentTrendInsight,
  INSIGHT_THRESHOLDS,
} from "@/features/dashboard/utils/buildDashboardPeriodInsights";
import type {
  DashboardPeriodSnapshot,
  PeriodComparison,
  PeriodEvolutionPoint,
  TopSellingProduct,
  WeekdayPerformancePoint,
} from "@/features/dashboard/types/dashboard";

function comparison(
  partial: Partial<PeriodComparison> &
    Pick<PeriodComparison, "current" | "previous" | "changePercent">
): PeriodComparison {
  return {
    trend:
      partial.changePercent > 0.5
        ? "up"
        : partial.changePercent < -0.5
          ? "down"
          : "neutral",
    hasComparableHistory: true,
    ...partial,
  };
}

function emptyWeekdays(): WeekdayPerformancePoint[] {
  return ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map(
    (label, weekdayIndex) => ({
      weekdayIndex,
      label,
      revenue: 0,
      salesCount: 0,
      averageTicket: 0,
    })
  );
}

function dayPoints(revenues: number[]): PeriodEvolutionPoint[] {
  return revenues.map((revenue, index) => ({
    key: `2026-08-${String(index + 1).padStart(2, "0")}`,
    label: `${index + 1} Ago`,
    revenue,
    salesCount: revenue > 0 ? 1 : 0,
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
    hour: null,
  }));
}

function snapshot(
  overrides: Partial<DashboardPeriodSnapshot> = {}
): DashboardPeriodSnapshot {
  return {
    period: "last_7_days",
    label: "Últimos 7 dias",
    shortLabel: "7 dias",
    comparisonHint: "Comparado aos 7 dias anteriores",
    revenue: 1000,
    salesCount: 10,
    averageTicket: 100,
    comparison: comparison({
      current: 1000,
      previous: 1000,
      changePercent: 0,
      hasComparableHistory: false,
    }),
    topProducts: [],
    totalUnitsSold: 0,
    evolutionGranularity: "day",
    evolution: dayPoints([0, 0, 0, 0, 0, 0, 0]),
    weekdayPerformance: emptyWeekdays(),
    highlights: { bestWeekday: null, bestCalendarDay: null },
    ...overrides,
  };
}

function product(
  name: string,
  quantity: number,
  revenue = quantity * 10
): TopSellingProduct {
  return {
    productId: name,
    productName: name,
    totalQuantity: quantity,
    totalRevenue: revenue,
  };
}

describe("buildDashboardPeriodInsights", () => {
  it("crescimento válido acima do threshold", () => {
    const insights = buildDashboardPeriodInsights(
      snapshot({
        comparison: comparison({
          current: 11800,
          previous: 10000,
          changePercent: 18,
        }),
        topProducts: [product("Açaí", 5)],
      })
    );
    expect(insights.some((i) => i.id === "revenue_growth")).toBe(true);
  });

  it("sem histórico / previous zero não gera crescimento", () => {
    expect(
      buildDashboardPeriodInsights(
        snapshot({
          comparison: {
            current: 500,
            previous: 0,
            changePercent: 0,
            trend: "up",
            hasComparableHistory: false,
          },
        })
      ).find((i) => i.id === "revenue_growth")
    ).toBeUndefined();
  });

  it("variação pequena abaixo do threshold não gera crescimento", () => {
    expect(
      buildDashboardPeriodInsights(
        snapshot({
          comparison: comparison({
            current: 105,
            previous: 100,
            changePercent: 5,
          }),
        })
      ).find((i) => i.id === "revenue_growth")
    ).toBeUndefined();
  });

  it("queda significativa e queda leve", () => {
    const significant = buildDashboardPeriodInsights(
      snapshot({
        comparison: comparison({
          current: 80,
          previous: 100,
          changePercent: -20,
        }),
      })
    );
    expect(
      significant.find((i) => i.id === "revenue_decline_significant")?.tone
    ).toBe("attention");

    const mild = buildDashboardPeriodInsights(
      snapshot({
        comparison: comparison({
          current: 90,
          previous: 100,
          changePercent: -10,
        }),
        topProducts: [],
        highlights: { bestWeekday: null, bestCalendarDay: null },
        evolution: dayPoints([10, 10, 10, 10, 10, 10, 10]),
      })
    );
    expect(mild.some((i) => i.id === "revenue_decline_mild")).toBe(true);
  });

  it("queda abaixo do threshold leve não gera insight", () => {
    expect(
      buildDashboardPeriodInsights(
        snapshot({
          comparison: comparison({
            current: 97,
            previous: 100,
            changePercent: -3,
          }),
        })
      ).find((i) => i.category === "decline")
    ).toBeUndefined();
  });

  it("melhor produto e ranking vazio", () => {
    const withProduct = buildDashboardPeriodInsights(
      snapshot({
        topProducts: [product("Milkshake", 12), product("Outro", 88)],
      })
    );
    expect(withProduct.find((i) => i.id === "top_product")?.title).toContain(
      "Milkshake"
    );

    expect(
      buildDashboardPeriodInsights(snapshot({ topProducts: [] })).find(
        (i) => i.id === "top_product"
      )
    ).toBeUndefined();

    expect(
      buildDashboardPeriodInsights(
        snapshot({ topProducts: [product("X", 0)] })
      ).find((i) => i.id === "top_product")
    ).toBeUndefined();
  });

  it("concentração >= 25% aparece; < 25% não", () => {
    expect(
      buildDashboardPeriodInsights(
        snapshot({
          topProducts: [product("A", 25), product("B", 75)],
        })
      ).some((i) => i.id === "product_concentration")
    ).toBe(true);

    expect(
      buildDashboardPeriodInsights(
        snapshot({
          topProducts: [product("A", 24), product("B", 76)],
        })
      ).some((i) => i.id === "product_concentration")
    ).toBe(false);
  });

  it("highlights: 7d calendário, 30d weekday, hoje não", () => {
    const seven = buildDashboardPeriodInsights(
      snapshot({
        period: "last_7_days",
        highlights: {
          bestWeekday: {
            weekdayIndex: 5,
            label: "Sábado",
            revenue: 200,
            salesCount: 4,
            summaryLabel: "Melhor dia no período",
          },
          bestCalendarDay: {
            date: "2026-08-09",
            label: "Sábado, 9 de ago",
            revenue: 2350,
            salesCount: 20,
          },
        },
      })
    );
    expect(seven.some((i) => i.id === "best_calendar_day")).toBe(true);
    expect(seven.some((i) => i.id === "best_weekday")).toBe(false);

    const thirty = buildDashboardPeriodInsights(
      snapshot({
        period: "last_30_days",
        shortLabel: "30 dias",
        highlights: {
          bestWeekday: {
            weekdayIndex: 5,
            label: "Sábado",
            revenue: 5000,
            salesCount: 40,
            summaryLabel: "Dia com melhor desempenho",
          },
          bestCalendarDay: {
            date: "2026-08-09",
            label: "Sábado, 9 de ago",
            revenue: 2350,
            salesCount: 20,
          },
        },
      })
    );
    expect(thirty.some((i) => i.id === "best_weekday")).toBe(true);

    const today = buildDashboardPeriodInsights(
      snapshot({
        period: "today",
        evolutionGranularity: "hour",
        highlights: {
          bestWeekday: {
            weekdayIndex: 5,
            label: "Sábado",
            revenue: 100,
            salesCount: 1,
            summaryLabel: "x",
          },
          bestCalendarDay: {
            date: "2026-08-13",
            label: "Hoje",
            revenue: 100,
            salesCount: 1,
          },
        },
      })
    );
    expect(today.some((i) => i.id === "best_weekday")).toBe(false);
    expect(today.some((i) => i.id === "best_calendar_day")).toBe(false);
  });

  it("tendência recente 7d e 30d; insuficientes; hoje não", () => {
    const up7 = snapshot({
      period: "last_7_days",
      evolution: dayPoints([10, 10, 10, 40, 40, 40, 40]),
    });
    // last 3: 40+40+40=120; prev 3: 10+10+40=60 → +100%
    // Wait points are 7: indices 0..6, last 3 = [40,40,40]=120, prev 3 = [10,10,40]=60
    const trendUp = buildRecentTrendInsight(up7);
    expect(trendUp?.id).toBe("recent_trend_up");

    const down7 = snapshot({
      period: "last_7_days",
      evolution: dayPoints([40, 40, 40, 10, 10, 10, 10]),
    });
    expect(buildRecentTrendInsight(down7)?.id).toBe("recent_trend_down");

    const up30 = snapshot({
      period: "last_30_days",
      evolution: dayPoints([
        ...Array(16).fill(10),
        ...Array(7).fill(10),
        ...Array(7).fill(40),
      ]),
    });
    expect(buildRecentTrendInsight(up30)?.id).toBe("recent_trend_up");

    expect(
      buildRecentTrendInsight(
        snapshot({
          period: "today",
          evolutionGranularity: "hour",
          evolution: [],
        })
      )
    ).toBeNull();

    expect(
      buildRecentTrendInsight(
        snapshot({
          evolution: dayPoints([1, 2, 3]),
        })
      )
    ).toBeNull();
  });

  it("máximo 3, prioridade e dedupe de tema revenue_direction", () => {
    const insights = buildDashboardPeriodInsights(
      snapshot({
        period: "last_30_days",
        comparison: comparison({
          current: 80,
          previous: 100,
          changePercent: -20,
        }),
        evolution: dayPoints([
          ...Array(16).fill(40),
          ...Array(7).fill(40),
          ...Array(7).fill(10),
        ]),
        topProducts: [product("Açaí", 80), product("Outro", 20)],
        highlights: {
          bestWeekday: {
            weekdayIndex: 5,
            label: "Sábado",
            revenue: 900,
            salesCount: 9,
            summaryLabel: "Dia com melhor desempenho",
          },
          bestCalendarDay: {
            date: "2026-08-09",
            label: "Sábado, 9 de ago",
            revenue: 500,
            salesCount: 5,
          },
        },
      })
    );

    expect(insights.length).toBeLessThanOrEqual(INSIGHT_THRESHOLDS.maxInsights);
    expect(insights[0]?.id).toBe("revenue_decline_significant");
    // growth/trend/decline share revenue_direction — only one of them
    const directionCount = insights.filter((i) =>
      ["growth", "decline", "trend"].includes(i.category)
    ).length;
    expect(directionCount).toBeLessThanOrEqual(1);
  });

  it("período sem vendas e sem comparação → lista vazia", () => {
    expect(
      buildDashboardPeriodInsights(
        snapshot({
          revenue: 0,
          salesCount: 0,
          topProducts: [],
          comparison: {
            current: 0,
            previous: 0,
            changePercent: 0,
            trend: "neutral",
            hasComparableHistory: false,
          },
        })
      )
    ).toEqual([]);
  });
});
