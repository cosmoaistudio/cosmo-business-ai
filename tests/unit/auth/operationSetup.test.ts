import { describe, expect, it } from "vitest";
import {
  assertOperationCtaIsNeverCompanyOnboarding,
  getOperationSetupStatus,
} from "@/features/operation-onboarding/utils/getOperationSetupStatus";
import type { OperationSetupSignals } from "@/features/operation-onboarding/types";
import {
  resolveAppStartupState,
  resolvePostAuthPath,
} from "@/features/auth/utils/appStartup";
import { getDefaultRouteForRole } from "@/features/auth/types/roles";
import { resolvePrivateRouteAccess } from "@/features/auth/utils/authGate";

const empty: OperationSetupSignals = {
  hasFirstProductReady: false,
  hasActiveProductWithoutCategory: false,
  hasAddonGroup: false,
  hasMenuReady: false,
  hasDigitalOrderConfigured: false,
  hasFirstSale: false,
};

describe("operation setup status — 5 steps", () => {
  it("nenhum passo = 0%", () => {
    const status = getOperationSetupStatus(empty);
    expect(status.totalSteps).toBe(5);
    expect(status.completedSteps).toBe(0);
    expect(status.progressPercent).toBe(0);
    expect(status.nextStep?.id).toBe("first_product");
    expect(status.nextStep?.href).toBe("/produtos");
    expect(status.nextStep?.visualState).toBe("current");
  });

  it("progresso: 0 → 40 (produto+cardápio) → 60 → 80 → 100", () => {
    // first_product e menu compartilham a prontidão real do catálogo
    // (produto ativo + categoria). Sem flag fake de "revisado".
    expect(getOperationSetupStatus(empty).progressPercent).toBe(0);

    const afterProduct = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    expect(afterProduct.completedSteps).toBe(2);
    expect(afterProduct.progressPercent).toBe(40);

    expect(
      getOperationSetupStatus({
        ...empty,
        hasFirstProductReady: true,
        hasMenuReady: true,
        hasAddonGroup: true,
      }).progressPercent
    ).toBe(60);

    expect(
      getOperationSetupStatus({
        ...empty,
        hasFirstProductReady: true,
        hasMenuReady: true,
        hasAddonGroup: true,
        hasDigitalOrderConfigured: true,
      }).progressPercent
    ).toBe(80);

    expect(
      getOperationSetupStatus({
        hasFirstProductReady: true,
        hasActiveProductWithoutCategory: false,
        hasAddonGroup: true,
        hasMenuReady: true,
        hasDigitalOrderConfigured: true,
        hasFirstSale: true,
      }).progressPercent
    ).toBe(100);
  });

  it("cada passo isolado contribui 20% quando concluído individualmente", () => {
    // Simula concluídos em sequência lógica (sem pular menu junto no assert unitário)
    const onlyAddonsImpossibleAlone = getOperationSetupStatus({
      ...empty,
      hasAddonGroup: true,
    });
    expect(onlyAddonsImpossibleAlone.progressPercent).toBe(20);
    expect(onlyAddonsImpossibleAlone.completedSteps).toBe(1);

    const onlyDigital = getOperationSetupStatus({
      ...empty,
      hasDigitalOrderConfigured: true,
    });
    expect(onlyDigital.progressPercent).toBe(20);

    const onlySale = getOperationSetupStatus({
      ...empty,
      hasFirstSale: true,
    });
    expect(onlySale.progressPercent).toBe(20);
  });

  it("produto ativo sem categoria NÃO conclui o primeiro passo", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasActiveProductWithoutCategory: true,
      hasFirstProductReady: false,
      hasMenuReady: false,
    });
    expect(
      status.steps.find((s) => s.id === "first_product")?.completed
    ).toBe(false);
    expect(status.nextStep?.id).toBe("first_product");
    expect(status.progressPercent).toBe(0);
  });

  it("produto ativo com categoria conclui primeiro produto e cardápio", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    expect(
      status.steps.find((s) => s.id === "first_product")?.completed
    ).toBe(true);
    expect(status.steps.find((s) => s.id === "menu")?.completed).toBe(true);
    expect(status.nextStep?.id).toBe("addons");
    expect(status.nextStep?.href).toBe("/opcoes/grupos");
  });

  it("option_groups conclui adicionais", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
    });
    expect(status.steps.find((s) => s.id === "addons")?.completed).toBe(true);
    expect(status.nextStep?.id).toBe("digital_order");
    expect(status.nextStep?.href).toBe("/configuracoes/pedido-digital");
  });

  it("pedido digital usa critério real (hasDigitalOrderConfigured)", () => {
    const pending = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
      hasDigitalOrderConfigured: false,
    });
    expect(
      pending.steps.find((s) => s.id === "digital_order")?.completed
    ).toBe(false);

    const done = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
      hasDigitalOrderConfigured: true,
    });
    expect(done.steps.find((s) => s.id === "digital_order")?.completed).toBe(
      true
    );
    expect(done.nextStep?.id).toBe("first_sale");
    expect(done.nextStep?.href).toBe("/pdv");
  });

  it("sale completed conclui primeira venda", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: true,
      hasMenuReady: true,
      hasDigitalOrderConfigured: true,
      hasFirstSale: true,
    });
    expect(status.steps.find((s) => s.id === "first_sale")?.completed).toBe(
      true
    );
    expect(status.allComplete).toBe(true);
    expect(status.nextStep).toBeNull();
    expect(status.progressPercent).toBe(100);
  });

  it("CTA aponta para o próximo passo e nunca para /onboarding", () => {
    const cases: Array<{
      signals: OperationSetupSignals;
      expectedHref: string;
    }> = [
      { signals: empty, expectedHref: "/produtos" },
      {
        signals: {
          ...empty,
          hasFirstProductReady: true,
          hasMenuReady: true,
        },
        expectedHref: "/opcoes/grupos",
      },
      {
        signals: {
          ...empty,
          hasFirstProductReady: true,
          hasMenuReady: true,
          hasAddonGroup: true,
        },
        expectedHref: "/configuracoes/pedido-digital",
      },
      {
        signals: {
          ...empty,
          hasFirstProductReady: true,
          hasMenuReady: true,
          hasAddonGroup: true,
          hasDigitalOrderConfigured: true,
        },
        expectedHref: "/pdv",
      },
    ];

    for (const { signals, expectedHref } of cases) {
      const status = getOperationSetupStatus(signals);
      expect(status.nextStep?.href).toBe(expectedHref);
      expect(
        assertOperationCtaIsNeverCompanyOnboarding(status.nextStep?.href)
      ).toBe(true);
    }
  });

  it("operação completa não tem fluxo pendente", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: true,
      hasMenuReady: true,
      hasDigitalOrderConfigured: true,
      hasFirstSale: true,
    });
    expect(status.allComplete).toBe(true);
    expect(status.nextStep).toBeNull();
    expect(status.otherSteps).toHaveLength(5);
  });

  it("usuário antigo com dados existentes = 100%", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: true,
      hasMenuReady: true,
      hasDigitalOrderConfigured: true,
      hasFirstSale: true,
    });
    expect(status.completedSteps).toBe(5);
    expect(status.progressPercent).toBe(100);
  });

  it("próximo passo recebe educationSteps prontos para a UI", () => {
    const status = getOperationSetupStatus(empty);
    expect(status.nextStep?.educationSteps.length).toBeGreaterThan(0);
    expect(status.nextStep?.tip.length).toBeGreaterThan(0);
  });

  it("não existe mais passo category separado", () => {
    const status = getOperationSetupStatus(empty);
    expect(status.steps.some((s) => (s.id as string) === "category")).toBe(
      false
    );
    expect(status.steps.map((s) => s.id)).toEqual([
      "first_product",
      "addons",
      "menu",
      "digital_order",
      "first_sale",
    ]);
  });
});

describe("company onboarding vs operation guide", () => {
  it("empresa concluída não vai novamente para /onboarding", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: {
        onboarding_completed: true,
        name: "Rede Açaí",
      },
    });
    expect(startup.status).toBe("ready");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/" })).toBe("/");
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        role: "admin",
        organization: { onboarding_completed: true, name: "Rede Açaí" },
        path: "/",
      })
    ).toBe("allow");
  });

  it("empresa pendente continua indo para /onboarding", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: {
        onboarding_completed: false,
        name: "Minha Empresa",
      },
    });
    expect(startup.status).toBe("needs_onboarding");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/" })).toBe(
      "/onboarding"
    );
  });

  it("kitchen pronto continua respeitando rota de cozinha", () => {
    expect(getDefaultRouteForRole("kitchen")).toBe("/cozinha");
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "kitchen",
      organization: { onboarding_completed: true, name: "Rede Açaí" },
    });
    expect(
      resolvePostAuthPath({
        startup,
        roleDefaultPath: getDefaultRouteForRole("kitchen"),
      })
    ).toBe("/cozinha");
  });
});
