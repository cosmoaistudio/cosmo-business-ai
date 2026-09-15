import { describe, expect, it } from "vitest";
import { getOrganizationInitials } from "@/lib/organizationInitials";
import { getOperationSetupStatus } from "@/features/operation-onboarding/utils/getOperationSetupStatus";
import { buildContextualStorageScope } from "@/features/operation-onboarding/utils/contextualDismiss";
import { resolveContextualPresentation } from "@/features/operation-onboarding/utils/resolveContextualPresentation";
import type { OperationSetupSignals } from "@/features/operation-onboarding/types";

describe("getOrganizationInitials", () => {
  it("uma palavra → uma inicial", () => {
    expect(getOrganizationInitials("Cosmo")).toBe("C");
  });

  it("duas palavras → primeira + última", () => {
    expect(getOrganizationInitials("Cosmo Burger")).toBe("CB");
  });

  it("várias palavras → primeira + última (Açaí do Cosmo → AC)", () => {
    expect(getOrganizationInitials("Açaí do Cosmo")).toBe("AC");
  });

  it("vazio → ?", () => {
    expect(getOrganizationInitials("")).toBe("?");
    expect(getOrganizationInitials(null)).toBe("?");
  });
});

describe("dashboard operation status labels (via operation-onboarding)", () => {
  const empty: OperationSetupSignals = {
    hasFirstProductReady: false,
    hasActiveProductWithoutCategory: false,
    hasAddonGroup: false,
    hasMenuReady: false,
    hasDigitalOrderConfigured: false,
    hasFirstSale: false,
  };

  it("progresso < 100% → não allComplete (Configuração em andamento)", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    expect(status.allComplete).toBe(false);
    expect(status.progressPercent).toBeLessThan(100);
  });

  it("100% → allComplete (Operação configurada)", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: true,
      hasMenuReady: true,
      hasDigitalOrderConfigured: true,
      hasFirstSale: true,
    });
    expect(status.allComplete).toBe(true);
    expect(status.progressPercent).toBe(100);
  });
});

describe("contextual dismiss isolation", () => {
  it("chaves incluem organization_id + user_id + stepId", () => {
    expect(buildContextualStorageScope("org-a", "user-1", "first_product")).toBe(
      "org-a:user-1:first_product"
    );
    expect(buildContextualStorageScope("org-b", "user-1", "first_product")).not.toBe(
      buildContextualStorageScope("org-a", "user-1", "first_product")
    );
    expect(buildContextualStorageScope("org-a", "user-2", "first_product")).not.toBe(
      buildContextualStorageScope("org-a", "user-1", "first_product")
    );
  });

  it("dismiss não altera progresso real; Dashboard nextStep permanece", () => {
    const empty: OperationSetupSignals = {
      hasFirstProductReady: false,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: false,
      hasMenuReady: false,
      hasDigitalOrderConfigured: false,
      hasFirstSale: false,
    };
    const status = getOperationSetupStatus(empty);
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product"],
      watchedIncompleteIds: ["first_product"],
      isDismissed: () => true,
      wasCelebrated: () => false,
    });
    expect(presentation.type).toBe("none");
    expect(status.nextStep?.id).toBe("first_product");
    expect(status.progressPercent).toBe(0);
  });
});
