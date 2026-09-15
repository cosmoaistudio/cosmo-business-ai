import { describe, expect, it } from "vitest";
import {
  buildDailyEvolution,
  buildHourlyEvolution,
  buildPeriodAnalytics,
  buildWeekdayPerformance,
  pickBestCalendarDay,
  pickBestWeekday,
  toLocalDateKey,
  toMondayFirstWeekdayIndex,
  WEEKDAY_LABELS_MON_FIRST,
} from "@/features/dashboard/utils/dashboardPeriodAnalytics";
import { resolveDashboardPeriodWindows } from "@/features/dashboard/utils/dashboardPeriods";
import { buildDashboardMetrics } from "@/features/dashboard/utils/dashboardAggregations";
import { buildDashboardAttentionAlerts } from "@/features/dashboard/utils/buildDashboardAttentionAlerts";
import { getOperationSetupStatus } from "@/features/operation-onboarding";
import type { Product } from "@/features/products";

const NOW = new Date(2026, 7, 13, 15, 30, 0); // Thu 13 Aug 2026 15:30

function sale(id: string, total: number, created: Date) {
  return { id, total, created_at: created.toISOString() };
}

describe("dashboardPeriodAnalytics — evolution", () => {
  it("hoje agrupa por hora local com zeros entre a primeira e a atual", () => {
    const sales = [
      sale("a", 40, new Date(2026, 7, 13, 10, 15, 0)),
      sale("b", 60, new Date(2026, 7, 13, 10, 45, 0)),
      sale("c", 20, new Date(2026, 7, 13, 14, 0, 0)),
    ];
    const points = buildHourlyEvolution(sales, NOW);
    expect(points[0]?.hour).toBe(10);
    expect(points[points.length - 1]?.hour).toBe(15);
    expect(points.find((p) => p.hour === 10)?.revenue).toBe(100);
    expect(points.find((p) => p.hour === 11)?.revenue).toBe(0);
    expect(points.find((p) => p.hour === 14)?.revenue).toBe(20);
    expect(points.find((p) => p.hour === 15)?.salesCount).toBe(0);
  });

  it("hoje sem vendas retorna série vazia", () => {
    expect(buildHourlyEvolution([], NOW)).toEqual([]);
  });

  it("7 dias gera exatamente 7 pontos com zeros", () => {
    const windows = resolveDashboardPeriodWindows("last_7_days", NOW);
    const sales = [
      sale("in", 100, new Date(2026, 7, 13, 10, 0, 0)),
      // window.start is typically on calendar day today-7 (outside the 7 day buckets today-6…today)
      sale("edge-start", 50, new Date(windows.current.start.getTime())),
      sale("out", 999, new Date(windows.current.start.getTime() - 1)),
    ];
    const points = buildDailyEvolution(sales, windows.current, NOW, 7);
    expect(points).toHaveLength(7);
    expect(points.every((p) => p.date)).toBe(true);
    expect(points[points.length - 1]?.date).toBe(toLocalDateKey(NOW));
    // Only sales on the 7 calendar days that also fall inside the rolling window
    expect(points.reduce((sum, p) => sum + p.revenue, 0)).toBe(100);
  });

  it("30 dias gera exatamente 30 pontos", () => {
    const windows = resolveDashboardPeriodWindows("last_30_days", NOW);
    const points = buildDailyEvolution([], windows.current, NOW, 30);
    expect(points).toHaveLength(30);
    expect(points.every((p) => p.revenue === 0 && p.salesCount === 0)).toBe(
      true
    );
  });

  it("limites inclusivos e venda fora da janela não entram", () => {
    const windows = resolveDashboardPeriodWindows("last_7_days", NOW);
    const sales = [
      sale("start", 10, new Date(windows.current.start.getTime())),
      sale("end", 20, new Date(windows.current.end.getTime())),
      sale("before", 99, new Date(windows.current.start.getTime() - 1000)),
      sale("after", 88, new Date(windows.current.end.getTime() + 1000)),
    ];
    const analytics = buildPeriodAnalytics({
      period: "last_7_days",
      sales,
      now: NOW,
    });
    // end is on today bucket; start day is outside the 7 calendar buckets
    expect(analytics.evolution.reduce((s, p) => s + p.revenue, 0)).toBe(20);
    expect(analytics.evolution).toHaveLength(7);
  });

  it("toLocalDateKey não usa UTC slice", () => {
    // evening local should keep same calendar day
    const local = new Date(2026, 7, 13, 23, 30, 0);
    expect(toLocalDateKey(local)).toBe("2026-08-13");
  });
});

describe("dashboardPeriodAnalytics — weekday", () => {
  it("ordem fixa segunda → domingo", () => {
    const points = buildWeekdayPerformance([]);
    expect(points.map((p) => p.label)).toEqual([...WEEKDAY_LABELS_MON_FIRST]);
    expect(points.map((p) => p.weekdayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("agrega revenue, count e ticket", () => {
    // 2026-08-10 Monday, 2026-08-11 Tuesday
    const sales = [
      sale("m1", 100, new Date(2026, 7, 10, 12, 0, 0)),
      sale("m2", 50, new Date(2026, 7, 10, 18, 0, 0)),
      sale("t1", 80, new Date(2026, 7, 11, 12, 0, 0)),
    ];
    const points = buildWeekdayPerformance(sales);
    expect(toMondayFirstWeekdayIndex(new Date(2026, 7, 10))).toBe(0);
    expect(points[0]).toMatchObject({
      label: "Segunda",
      revenue: 150,
      salesCount: 2,
      averageTicket: 75,
    });
    expect(points[1]).toMatchObject({
      label: "Terça",
      revenue: 80,
      salesCount: 1,
      averageTicket: 80,
    });
  });

  it("zero vendas → tickets 0", () => {
    const points = buildWeekdayPerformance([]);
    expect(points.every((p) => p.averageTicket === 0)).toBe(true);
  });
});

describe("dashboardPeriodAnalytics — highlights", () => {
  it("hoje não elege melhor weekday nem melhor data", () => {
    const analytics = buildPeriodAnalytics({
      period: "today",
      sales: [sale("a", 100, new Date(2026, 7, 13, 11, 0, 0))],
      now: NOW,
    });
    expect(analytics.highlights.bestWeekday).toBeNull();
    expect(analytics.highlights.bestCalendarDay).toBeNull();
  });

  it("melhor weekday por revenue com desempates", () => {
    const weekday = buildWeekdayPerformance([
      sale("a", 100, new Date(2026, 7, 10, 12, 0, 0)), // Mon
      sale("b", 100, new Date(2026, 7, 11, 12, 0, 0)), // Tue — same revenue, 1 sale
      sale("c", 50, new Date(2026, 7, 10, 13, 0, 0)), // Mon more sales
    ]);
    // Mon revenue 150 vs Tue 100 → Mon wins
    const best = pickBestWeekday(weekday, "last_7_days");
    expect(best?.label).toBe("Segunda");
    expect(best?.summaryLabel).toBe("Melhor dia no período");

    const tied = buildWeekdayPerformance([
      sale("a", 100, new Date(2026, 7, 10, 12, 0, 0)),
      sale("b", 100, new Date(2026, 7, 12, 12, 0, 0)), // Wed
    ]);
    // same revenue+count → lower weekdayIndex (Mon) wins
    expect(pickBestWeekday(tied, "last_30_days")?.label).toBe("Segunda");
    expect(pickBestWeekday(tied, "last_30_days")?.summaryLabel).toBe(
      "Dia com melhor desempenho"
    );
  });

  it("melhor data por revenue, depois count, depois mais recente", () => {
    const evolution = buildDailyEvolution(
      [
        sale("a", 100, new Date(2026, 7, 12, 10, 0, 0)),
        sale("b", 100, new Date(2026, 7, 13, 10, 0, 0)),
      ],
      resolveDashboardPeriodWindows("last_7_days", NOW).current,
      NOW,
      7
    );
    // same revenue+count → more recent (13) wins
    const best = pickBestCalendarDay(evolution, "last_7_days");
    expect(best?.date).toBe("2026-08-13");

    expect(pickBestCalendarDay(evolution, "today")).toBeNull();
    expect(pickBestCalendarDay([], "last_7_days")).toBeNull();
  });

  it("sem vendas → sem highlights", () => {
    const analytics = buildPeriodAnalytics({
      period: "last_7_days",
      sales: [],
      now: NOW,
    });
    expect(analytics.highlights.bestWeekday).toBeNull();
    expect(analytics.highlights.bestCalendarDay).toBeNull();
  });
});

describe("period analytics integration with snapshot", () => {
  it("periodMetrics inclui evolution/weekday e alertas seguem todaySales", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        {
          id: "old",
          total: 200,
          created_at: new Date(2026, 7, 1, 10, 0, 0).toISOString(),
          sale_number: 1,
          customer_id: null,
        },
      ],
      products: [] as Product[],
      stockAlerts: [],
      totalCustomers: 0,
      newCustomersToday: 0,
      saleItems: [],
      saleItemOptions: [],
      financialTransactions: [],
      customerNames: new Map(),
      now: NOW,
    });

    expect(metrics.periodMetrics.last_30_days.evolution).toHaveLength(30);
    expect(metrics.periodMetrics.last_7_days.evolution).toHaveLength(7);
    expect(metrics.periodMetrics.today.evolutionGranularity).toBe("hour");
    expect(metrics.todaySales).toBe(0);

    const alerts = buildDashboardAttentionAlerts({
      stats: metrics,
      statsLoading: false,
      statsError: false,
      operationStatus: getOperationSetupStatus({
        hasFirstProductReady: true,
        hasActiveProductWithoutCategory: false,
        hasAddonGroup: true,
        hasMenuReady: true,
        hasDigitalOrderConfigured: true,
        hasFirstSale: true,
      }),
      operationLoading: false,
    });
    expect(Array.isArray(alerts)).toBe(true);
  });
});
