import { describe, expect, it } from "vitest";
import {
  buildComparison,
  buildDashboardMetrics,
  buildTopSellingProducts,
  computeAverageTicket,
  filterSalesInSameHourWindow,
} from "@/features/dashboard/utils/dashboardAggregations";
import type { Product } from "@/features/products";

const NOW = new Date(2026, 7, 13, 15, 30, 0); // 13 Aug 2026 15:30 local

function sale(partial: {
  id: string;
  total: number;
  created_at: string;
  customer_id?: string | null;
  sale_number?: number;
}) {
  return {
    sale_number: partial.sale_number ?? 1,
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

function emptyProducts(): Product[] {
  return [];
}

describe("dashboardAggregations — real sales metrics", () => {
  it("buildComparison não inventa percentual sem histórico", () => {
    const result = buildComparison(1000, 0);
    expect(result.hasComparableHistory).toBe(false);
    expect(result.changePercent).toBe(0);
  });

  it("buildComparison calcula variação quando há histórico", () => {
    const result = buildComparison(118, 100);
    expect(result.hasComparableHistory).toBe(true);
    expect(result.changePercent).toBe(18);
    expect(result.trend).toBe("up");
  });

  it("ticket médio evita divisão por zero", () => {
    expect(computeAverageTicket(0, 0)).toBe(0);
    expect(computeAverageTicket(200, 4)).toBe(50);
  });

  it("filtra janela mesmo horário de ontem", () => {
    const yesterdayStart = new Date(2026, 7, 12, 0, 0, 0);
    const sales = [
      sale({
        id: "in",
        total: 10,
        created_at: new Date(2026, 7, 12, 14, 0, 0).toISOString(),
      }),
      sale({
        id: "out",
        total: 99,
        created_at: new Date(2026, 7, 12, 16, 0, 0).toISOString(),
      }),
    ];

    const filtered = filterSalesInSameHourWindow(sales, yesterdayStart, NOW);
    expect(filtered.map((s) => s.id)).toEqual(["in"]);
  });

  it("resumo de hoje soma apenas vendas do dia (local)", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        sale({
          id: "today-1",
          total: 100,
          created_at: new Date(2026, 7, 13, 10, 0, 0).toISOString(),
        }),
        sale({
          id: "today-2",
          total: 50,
          created_at: new Date(2026, 7, 13, 12, 0, 0).toISOString(),
        }),
        sale({
          id: "yesterday",
          total: 999,
          created_at: new Date(2026, 7, 12, 10, 0, 0).toISOString(),
        }),
      ],
      products: emptyProducts(),
      stockAlerts: [],
      totalCustomers: 0,
      newCustomersToday: 0,
      saleItems: [],
      saleItemOptions: [],
      financialTransactions: [],
      customerNames: new Map(),
      now: NOW,
    });

    expect(metrics.todayRevenue).toBe(150);
    expect(metrics.todaySales).toBe(2);
    expect(metrics.todayAverageTicket).toBe(75);
  });

  it("compara hoje vs ontem no mesmo intervalo de horário", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        sale({
          id: "today",
          total: 120,
          created_at: new Date(2026, 7, 13, 14, 0, 0).toISOString(),
        }),
        sale({
          id: "y-in",
          total: 100,
          created_at: new Date(2026, 7, 12, 14, 0, 0).toISOString(),
        }),
        sale({
          id: "y-out",
          total: 500,
          created_at: new Date(2026, 7, 12, 18, 0, 0).toISOString(),
        }),
      ],
      products: emptyProducts(),
      stockAlerts: [],
      totalCustomers: 0,
      newCustomersToday: 0,
      saleItems: [],
      saleItemOptions: [],
      financialTransactions: [],
      customerNames: new Map(),
      now: NOW,
    });

    const comparison = metrics.comparisons.revenueTodayVsYesterday;
    expect(comparison.current).toBe(120);
    expect(comparison.previous).toBe(100);
    expect(comparison.hasComparableHistory).toBe(true);
    expect(comparison.changePercent).toBe(20);
  });

  it("sem histórico de ontem não inventa percentual", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        sale({
          id: "today",
          total: 80,
          created_at: new Date(2026, 7, 13, 11, 0, 0).toISOString(),
        }),
      ],
      products: emptyProducts(),
      stockAlerts: [],
      totalCustomers: 0,
      newCustomersToday: 0,
      saleItems: [],
      saleItemOptions: [],
      financialTransactions: [],
      customerNames: new Map(),
      now: NOW,
    });

    expect(
      metrics.comparisons.revenueTodayVsYesterday.hasComparableHistory
    ).toBe(false);
    expect(metrics.comparisons.revenueTodayVsYesterday.changePercent).toBe(0);
  });

  it("ranking de hoje agrega quantidade sem N+1 e é determinístico em empate", () => {
    const sales = [
      sale({
        id: "s1",
        total: 30,
        created_at: new Date(2026, 7, 13, 9, 0, 0).toISOString(),
      }),
      sale({
        id: "s2",
        total: 20,
        created_at: new Date(2026, 7, 12, 9, 0, 0).toISOString(),
      }),
    ];

    const saleItems = [
      item({
        sale_id: "s1",
        product_id: "p-b",
        product_name: "Banana",
        quantity: 5,
        subtotal: 25,
      }),
      item({
        sale_id: "s1",
        product_id: "p-a",
        product_name: "Abacate",
        quantity: 5,
        subtotal: 10,
      }),
      item({
        sale_id: "s1",
        product_id: "p-b",
        product_name: "Banana",
        quantity: 2,
        subtotal: 10,
      }),
      item({
        sale_id: "s2",
        product_id: "p-old",
        product_name: "Ontem",
        quantity: 99,
        subtotal: 99,
      }),
    ];

    const metrics = buildDashboardMetrics({
      sales,
      products: emptyProducts(),
      stockAlerts: [],
      totalCustomers: 0,
      newCustomersToday: 0,
      saleItems,
      saleItemOptions: [],
      financialTransactions: [],
      customerNames: new Map(),
      now: NOW,
    });

    expect(metrics.topSellingProductsToday).toHaveLength(2);
    expect(metrics.topSellingProductsToday[0]).toMatchObject({
      productId: "p-b",
      productName: "Banana",
      totalQuantity: 7,
    });
    // Empate de quantidade: maior receita primeiro; se empatar, nome pt-BR
    const tied = buildTopSellingProducts([
      item({
        sale_id: "x",
        product_id: "1",
        product_name: "Zebra",
        quantity: 3,
        subtotal: 10,
      }),
      item({
        sale_id: "x",
        product_id: "2",
        product_name: "Abelha",
        quantity: 3,
        subtotal: 10,
      }),
    ]);
    expect(tied.map((p) => p.productName)).toEqual(["Abelha", "Zebra"]);
  });

  it("estado sem vendas hoje zera métricas do dia", () => {
    const metrics = buildDashboardMetrics({
      sales: [
        sale({
          id: "old",
          total: 40,
          created_at: new Date(2026, 7, 10, 10, 0, 0).toISOString(),
        }),
      ],
      products: emptyProducts(),
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
    expect(metrics.todayRevenue).toBe(0);
    expect(metrics.todayAverageTicket).toBe(0);
    expect(metrics.topSellingProductsToday).toEqual([]);
  });
});
