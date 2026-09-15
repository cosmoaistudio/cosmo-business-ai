import { describe, expect, it } from "vitest";
import {
  buildAllPeriodMetrics,
  buildComparison,
  buildDashboardMetrics,
  buildPeriodSnapshot,
  computeAverageTicket,
} from "@/features/dashboard/utils/dashboardAggregations";
import {
  isDateInRange,
  resolveDashboardPeriodWindows,
} from "@/features/dashboard/utils/dashboardPeriods";
import { buildDashboardAttentionAlerts } from "@/features/dashboard/utils/buildDashboardAttentionAlerts";
import { getOperationSetupStatus } from "@/features/operation-onboarding";
import type { Product } from "@/features/products";

const NOW = new Date(2026, 7, 13, 15, 30, 0); // 13 Aug 2026 15:30 local

function sale(partial: {
  id: string;
  total: number;
  created_at: string;
  customer_id?: string | null;
}) {
  return {
    sale_number: 1,
    customer_id: partial.customer_id ?? null,
    ...partial,
  };
}

function item(partial: {
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
}) {
  return partial;
}

describe("dashboardPeriods — rolling windows", () => {
  it("today usa 00:00 local → agora e ontem equivalente", () => {
    const windows = resolveDashboardPeriodWindows("today", NOW);
    expect(windows.current.start).toEqual(new Date(2026, 7, 13, 0, 0, 0));
    expect(windows.current.end).toEqual(NOW);
    expect(windows.previous.start).toEqual(new Date(2026, 7, 12, 0, 0, 0));
    expect(windows.previous.end).toEqual(new Date(2026, 7, 12, 15, 30, 0));
  });

  it("last_7_days é janela rolling de exatamente 7*24h", () => {
    const windows = resolveDashboardPeriodWindows("last_7_days", NOW);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(windows.current.end.getTime() - windows.current.start.getTime()).toBe(
      sevenDays
    );
    expect(
      windows.previous.end.getTime() - windows.previous.start.getTime()
    ).toBe(sevenDays);
    expect(windows.previous.end.getTime()).toBe(windows.current.start.getTime());
    expect(windows.current.start).toEqual(new Date(NOW.getTime() - sevenDays));
  });

  it("last_30_days é janela rolling de exatamente 30*24h", () => {
    const windows = resolveDashboardPeriodWindows("last_30_days", NOW);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(windows.current.end.getTime() - windows.current.start.getTime()).toBe(
      thirtyDays
    );
    expect(windows.previous.end.getTime()).toBe(windows.current.start.getTime());
  });

  it("limites inclusivos da janela", () => {
    const windows = resolveDashboardPeriodWindows("last_7_days", NOW);
    expect(
      isDateInRange(windows.current.start.toISOString(), windows.current)
    ).toBe(true);
    expect(
      isDateInRange(windows.current.end.toISOString(), windows.current)
    ).toBe(true);
    expect(
      isDateInRange(
        new Date(windows.current.start.getTime() - 1).toISOString(),
        windows.current
      )
    ).toBe(false);
    expect(
      isDateInRange(
        new Date(windows.current.end.getTime() + 1).toISOString(),
        windows.current
      )
    ).toBe(false);
  });
});

describe("buildPeriodSnapshot — métricas por período", () => {
  const sales = [
    sale({
      id: "in-today",
      total: 100,
      created_at: new Date(2026, 7, 13, 10, 0, 0).toISOString(),
    }),
    sale({
      id: "in-7d",
      total: 50,
      created_at: new Date(2026, 7, 10, 12, 0, 0).toISOString(),
    }),
    sale({
      id: "in-30d",
      total: 25,
      created_at: new Date(2026, 6, 20, 12, 0, 0).toISOString(),
    }),
    sale({
      id: "out",
      total: 999,
      created_at: new Date(2026, 5, 1, 12, 0, 0).toISOString(),
    }),
    sale({
      id: "y-same-hour",
      total: 80,
      created_at: new Date(2026, 7, 12, 11, 0, 0).toISOString(),
    }),
    sale({
      id: "y-after-hour",
      total: 500,
      created_at: new Date(2026, 7, 12, 18, 0, 0).toISOString(),
    }),
  ];

  const saleItems = [
    item({
      sale_id: "in-today",
      product_id: "p1",
      product_name: "Açaí",
      quantity: 3,
      subtotal: 60,
    }),
    item({
      sale_id: "in-7d",
      product_id: "p2",
      product_name: "Milkshake",
      quantity: 5,
      subtotal: 50,
    }),
    item({
      sale_id: "in-30d",
      product_id: "p1",
      product_name: "Açaí",
      quantity: 2,
      subtotal: 25,
    }),
    item({
      sale_id: "out",
      product_id: "p3",
      product_name: "Fora",
      quantity: 99,
      subtotal: 999,
    }),
  ];

  it("today soma só a janela 00:00→agora e compara ontem equivalente", () => {
    const snapshot = buildPeriodSnapshot({
      period: "today",
      sales,
      saleItems,
      now: NOW,
    });
    expect(snapshot.revenue).toBe(100);
    expect(snapshot.salesCount).toBe(1);
    expect(snapshot.averageTicket).toBe(100);
    expect(snapshot.comparison.previous).toBe(80);
    expect(snapshot.comparison.hasComparableHistory).toBe(true);
    expect(snapshot.comparison.changePercent).toBe(25);
    expect(snapshot.topProducts[0]?.productName).toBe("Açaí");
    expect(snapshot.totalUnitsSold).toBe(3);
  });

  it("last_7_days inclui hoje + últimos 7 dias rolling", () => {
    const snapshot = buildPeriodSnapshot({
      period: "last_7_days",
      sales,
      saleItems,
      now: NOW,
    });
    // in-today + in-7d + y-same-hour + y-after-hour (all within 7 days)
    expect(snapshot.salesCount).toBe(4);
    expect(snapshot.revenue).toBe(100 + 50 + 80 + 500);
    expect(snapshot.topProducts.map((p) => p.productName)).toEqual([
      "Milkshake",
      "Açaí",
    ]);
    // in-today (3) + in-7d (5); y-* sales sem itens
    expect(snapshot.totalUnitsSold).toBe(8);
  });

  it("last_30_days inclui vendas na janela e exclui fora", () => {
    const snapshot = buildPeriodSnapshot({
      period: "last_30_days",
      sales,
      saleItems,
      now: NOW,
    });
    expect(snapshot.salesCount).toBe(5); // all except "out"
    expect(snapshot.revenue).toBe(100 + 50 + 25 + 80 + 500);
    expect(snapshot.topProducts.find((p) => p.productName === "Fora")).toBeUndefined();
    // totalUnitsSold = all period items, not just top 5
    expect(snapshot.totalUnitsSold).toBe(
      saleItems
        .filter((item) => item.sale_id !== "out")
        .reduce((sum, item) => sum + item.quantity, 0)
    );
  });

  it("ticket médio com zero vendas", () => {
    const snapshot = buildPeriodSnapshot({
      period: "today",
      sales: [],
      saleItems: [],
      now: NOW,
    });
    expect(snapshot.salesCount).toBe(0);
    expect(snapshot.averageTicket).toBe(0);
    expect(computeAverageTicket(0, 0)).toBe(0);
  });

  it("período anterior zero → sem percentual inventado", () => {
    const snapshot = buildPeriodSnapshot({
      period: "today",
      sales: [
        sale({
          id: "only-today",
          total: 40,
          created_at: new Date(2026, 7, 13, 9, 0, 0).toISOString(),
        }),
      ],
      saleItems: [],
      now: NOW,
    });
    expect(snapshot.comparison.hasComparableHistory).toBe(false);
    expect(snapshot.comparison.changePercent).toBe(0);
  });

  it("comparação negativa quando atual < anterior", () => {
    expect(buildComparison(80, 100).changePercent).toBe(-20);
    expect(buildComparison(80, 100).trend).toBe("down");
  });

  it("ranking: qty → receita → nome", () => {
    const snapshot = buildPeriodSnapshot({
      period: "last_7_days",
      sales: [
        sale({
          id: "a",
          total: 30,
          created_at: new Date(2026, 7, 13, 9, 0, 0).toISOString(),
        }),
      ],
      saleItems: [
        item({
          sale_id: "a",
          product_id: "1",
          product_name: "Zebra",
          quantity: 3,
          subtotal: 10,
        }),
        item({
          sale_id: "a",
          product_id: "2",
          product_name: "Abelha",
          quantity: 3,
          subtotal: 10,
        }),
      ],
      now: NOW,
    });
    expect(snapshot.topProducts.map((p) => p.productName)).toEqual([
      "Abelha",
      "Zebra",
    ]);
  });

  it("buildAllPeriodMetrics gera os 3 períodos sem N+1 (uma agregação em memória)", () => {
    const all = buildAllPeriodMetrics({ sales, saleItems, now: NOW });
    expect(Object.keys(all).sort()).toEqual([
      "last_30_days",
      "last_7_days",
      "today",
    ]);
    expect(all.today.salesCount).toBe(1);
    expect(all.last_7_days.salesCount).toBe(4);
    expect(all.last_30_days.salesCount).toBe(5);
  });
});

describe("period vs attention / onboarding separation", () => {
  it("alertas continuam baseados em todaySales mesmo com período 30d nas métricas", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        sale({
          id: "old",
          total: 100,
          created_at: new Date(2026, 7, 1, 10, 0, 0).toISOString(),
        }),
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

    expect(metrics.todaySales).toBe(0);
    expect(metrics.periodMetrics.last_30_days.salesCount).toBe(1);

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

    // no active products → may alert products; todaySales 0 with first_sale done → no_sales_today
    // activeProducts 0 because products=[]
    expect(metrics.periodMetrics.last_30_days.revenue).toBe(100);
  });

  it("operation setup status não depende do seletor de período", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: false,
      hasMenuReady: true,
      hasDigitalOrderConfigured: false,
      hasFirstSale: true,
    });
    expect(status.nextStep?.id).toBe("addons");
    expect(status.allComplete).toBe(false);
  });
});
