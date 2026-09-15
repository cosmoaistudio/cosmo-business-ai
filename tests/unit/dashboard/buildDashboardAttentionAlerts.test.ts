import { describe, expect, it } from "vitest";
import { getOperationSetupStatus } from "@/features/operation-onboarding";
import type { OperationSetupSignals } from "@/features/operation-onboarding";
import { buildDashboardAttentionAlerts } from "@/features/dashboard/utils/buildDashboardAttentionAlerts";

function signals(
  partial: Partial<OperationSetupSignals> = {}
): OperationSetupSignals {
  return {
    hasFirstProductReady: false,
    hasActiveProductWithoutCategory: false,
    hasAddonGroup: false,
    hasMenuReady: false,
    hasDigitalOrderConfigured: false,
    hasFirstSale: false,
    ...partial,
  };
}

function statusFrom(partial: Partial<OperationSetupSignals> = {}) {
  return getOperationSetupStatus(signals(partial));
}

const readyOperation = statusFrom({
  hasFirstProductReady: true,
  hasAddonGroup: true,
  hasMenuReady: true,
  hasDigitalOrderConfigured: true,
  hasFirstSale: true,
});

describe("buildDashboardAttentionAlerts", () => {
  it("não emite alertas enquanto stats ou operation estão loading", () => {
    expect(
      buildDashboardAttentionAlerts({
        stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
        statsLoading: true,
        statsError: false,
        operationStatus: readyOperation,
        operationLoading: false,
      })
    ).toEqual([]);

    expect(
      buildDashboardAttentionAlerts({
        stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
        statsLoading: false,
        statsError: false,
        operationStatus: readyOperation,
        operationLoading: true,
      })
    ).toEqual([]);
  });

  it("erro de métricas não gera falso alerta de produtos/vendas", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: true,
      operationStatus: readyOperation,
      operationLoading: false,
    });

    expect(alerts.find((a) => a.id === "no_products")).toBeUndefined();
    expect(alerts.find((a) => a.id === "products_inactive")).toBeUndefined();
    expect(alerts.find((a) => a.id === "no_sales_today")).toBeUndefined();
  });

  it("nenhum produto cadastrado gera alerta high (quando não é o nextStep do guia)", () => {
    // first_product incomplete → nextStep is first_product → suppressed
    const suppressed = buildDashboardAttentionAlerts({
      stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom(),
      operationLoading: false,
    });
    expect(suppressed.find((a) => a.id === "no_products")).toBeUndefined();

    // first_product already complete in status but stats say 0 products (stale edge)
    // nextStep would be addons → product alert can surface
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasMenuReady: true,
      }),
      operationLoading: false,
    });
    expect(alerts[0]?.id).toBe("no_products");
    expect(alerts[0]?.priority).toBe("high");
    expect(alerts[0]?.href).toBe("/produtos");
  });

  it("produtos cadastrados mas todos inativos (mutuamente exclusivo com no_products)", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 4, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasMenuReady: true,
      }),
      operationLoading: false,
    });

    expect(alerts.some((a) => a.id === "no_products")).toBe(false);
    expect(alerts.some((a) => a.id === "products_inactive")).toBe(true);
    expect(alerts.find((a) => a.id === "products_inactive")?.priority).toBe(
      "high"
    );
  });

  it("pelo menos um produto ativo remove alertas de produto indisponível", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 3, activeProducts: 1, todaySales: 2 },
      statsLoading: false,
      statsError: false,
      operationStatus: readyOperation,
      operationLoading: false,
    });

    expect(alerts.some((a) => a.id === "no_products")).toBe(false);
    expect(alerts.some((a) => a.id === "products_inactive")).toBe(false);
  });

  it("pedido digital só aparece com first_product pronto e digital incompleto", () => {
    const tooEarly = buildDashboardAttentionAlerts({
      stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom(),
      operationLoading: false,
    });
    expect(tooEarly.find((a) => a.id === "digital_unpublished")).toBeUndefined();

    // nextStep === digital_order → suppressed (guide owns focus)
    const asNextStep = buildDashboardAttentionAlerts({
      stats: { totalProducts: 2, activeProducts: 2, todaySales: 1 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasAddonGroup: true,
        hasMenuReady: true,
        hasDigitalOrderConfigured: false,
        hasFirstSale: true,
      }),
      operationLoading: false,
    });
    expect(
      asNextStep.find((a) => a.id === "digital_unpublished")
    ).toBeUndefined();

    // digital pending but nextStep is addons → attention can remind about digital
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 2, activeProducts: 2, todaySales: 1 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasAddonGroup: false,
        hasMenuReady: true,
        hasDigitalOrderConfigured: false,
        hasFirstSale: true,
      }),
      operationLoading: false,
    });
    expect(alerts.some((a) => a.id === "digital_unpublished")).toBe(true);
    expect(alerts.find((a) => a.id === "digital_unpublished")?.priority).toBe(
      "medium"
    );
  });

  it("sem vendas hoje com operação pronta gera alerta low", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 5, activeProducts: 3, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: readyOperation,
      operationLoading: false,
    });

    expect(alerts.some((a) => a.id === "no_sales_today")).toBe(true);
    expect(alerts.find((a) => a.id === "no_sales_today")?.priority).toBe("low");
    expect(alerts.find((a) => a.id === "no_sales_today")?.href).toBe("/pdv");
  });

  it("venda completed hoje remove alerta de sem vendas", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 5, activeProducts: 3, todaySales: 1 },
      statsLoading: false,
      statsError: false,
      operationStatus: readyOperation,
      operationLoading: false,
    });

    expect(alerts.find((a) => a.id === "no_sales_today")).toBeUndefined();
  });

  it("todaySales=0 não conta cancelled: métricas já excluem cancelled; first_sale incompleto suprime alerta", () => {
    // Repository only counts completed. If first_sale incomplete, guide owns it.
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 2, activeProducts: 2, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasAddonGroup: true,
        hasMenuReady: true,
        hasDigitalOrderConfigured: true,
        hasFirstSale: false,
      }),
      operationLoading: false,
    });

    expect(alerts.find((a) => a.id === "no_sales_today")).toBeUndefined();
  });

  it("prioriza high > medium > low e limita a 3", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 4, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasAddonGroup: true,
        hasMenuReady: true,
        hasDigitalOrderConfigured: false,
        hasFirstSale: true,
      }),
      operationLoading: false,
      maxAlerts: 3,
    });

    expect(alerts.length).toBeLessThanOrEqual(3);
    expect(alerts[0]?.priority).toBe("high");
    // products_inactive + digital (nextStep is digital → digital suppressed)
    // only products_inactive since digital is nextStep
    expect(alerts.map((a) => a.id)).toEqual(["products_inactive"]);
  });

  it("maxAlerts corta a lista após ordenação", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 4, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom({
        hasFirstProductReady: true,
        hasAddonGroup: false,
        hasMenuReady: true,
        hasDigitalOrderConfigured: false,
        hasFirstSale: true,
      }),
      operationLoading: false,
      maxAlerts: 1,
    });

    // nextStep is addons → products_inactive + digital both eligible
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.id).toBe("products_inactive");
  });

  it("sem situações relevantes retorna lista vazia (sem card vazio)", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 5, activeProducts: 2, todaySales: 4 },
      statsLoading: false,
      statsError: false,
      operationStatus: readyOperation,
      operationLoading: false,
    });

    expect(alerts).toEqual([]);
  });

  it("não duplica nextStep do OperationSetupGuide", () => {
    const alerts = buildDashboardAttentionAlerts({
      stats: { totalProducts: 0, activeProducts: 0, todaySales: 0 },
      statsLoading: false,
      statsError: false,
      operationStatus: statusFrom(),
      operationLoading: false,
    });

    // Guide nextStep = first_product → no_products suppressed
    expect(alerts).toEqual([]);
  });
});
