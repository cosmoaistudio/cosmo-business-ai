import { describe, expect, it } from "vitest";
import { getOperationSetupStatus } from "@/features/operation-onboarding/utils/getOperationSetupStatus";
import { resolveContextualPresentation } from "@/features/operation-onboarding/utils/resolveContextualPresentation";
import type { OperationSetupSignals } from "@/features/operation-onboarding/types";

const empty: OperationSetupSignals = {
  hasFirstProductReady: false,
  hasActiveProductWithoutCategory: false,
  hasAddonGroup: false,
  hasMenuReady: false,
  hasDigitalOrderConfigured: false,
  hasFirstSale: false,
};

const neverDismissed = () => false;
const neverCelebrated = () => false;

describe("contextual setup presentation", () => {
  it("produto pendente mostra tutorial correto", () => {
    const status = getOperationSetupStatus(empty);
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product", "menu"],
      watchedIncompleteIds: ["first_product", "menu"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("pending");
    if (presentation.type === "pending") {
      expect(presentation.step.id).toBe("first_product");
      expect(presentation.step.href).toBe("/produtos");
    }
  });

  it("produto concluído não mostra tutorial pendente", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product"],
      watchedIncompleteIds: [],
      isDismissed: neverDismissed,
      wasCelebrated: () => true,
    });
    expect(presentation.type).toBe("none");
  });

  it("após concluir produto, mostra sucesso apontando para próximo passo real", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product"],
      watchedIncompleteIds: ["first_product"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("success");
    if (presentation.type === "success") {
      expect(presentation.completedStep.id).toBe("first_product");
      expect(presentation.nextStep?.id).toBe("addons");
      expect(presentation.nextStep?.href).toBe("/opcoes/grupos");
    }
  });

  it("adicionais pendentes mostram tutorial correto", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["addons"],
      watchedIncompleteIds: ["addons"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("pending");
    if (presentation.type === "pending") {
      expect(presentation.step.id).toBe("addons");
    }
  });

  it("após adicionais, sucesso aponta para próximo passo real", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["addons"],
      watchedIncompleteIds: ["addons"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("success");
    if (presentation.type === "success") {
      expect(presentation.nextStep?.id).toBe("digital_order");
      expect(presentation.nextStep?.href).toBe(
        "/configuracoes/pedido-digital"
      );
    }
  });

  it("pedido digital pendente mostra tutorial correto", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["digital_order"],
      watchedIncompleteIds: ["digital_order"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("pending");
    if (presentation.type === "pending") {
      expect(presentation.step.id).toBe("digital_order");
    }
  });

  it("primeira venda pendente mostra tutorial correto", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
      hasAddonGroup: true,
      hasDigitalOrderConfigured: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_sale"],
      watchedIncompleteIds: ["first_sale"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("pending");
    if (presentation.type === "pending") {
      expect(presentation.step.id).toBe("first_sale");
    }
  });

  it("fechar/dispensar não conclui etapa — só esconde pending", () => {
    const status = getOperationSetupStatus(empty);
    const dismissed = new Set(["first_product"]);
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product"],
      watchedIncompleteIds: ["first_product"],
      isDismissed: (id) => dismissed.has(id),
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("none");
    // Progresso real intacto
    expect(status.steps.find((s) => s.id === "first_product")?.completed).toBe(
      false
    );
    expect(status.progressPercent).toBe(0);
  });

  it("usuário 100% não recebe tutorial pendente", () => {
    const status = getOperationSetupStatus({
      hasFirstProductReady: true,
      hasActiveProductWithoutCategory: false,
      hasAddonGroup: true,
      hasMenuReady: true,
      hasDigitalOrderConfigured: true,
      hasFirstSale: true,
    });
    expect(status.allComplete).toBe(true);

    for (const relevant of [
      ["first_product", "menu"],
      ["addons"],
      ["digital_order"],
      ["first_sale"],
    ] as const) {
      const presentation = resolveContextualPresentation({
        status,
        relevantStepIds: [...relevant],
        watchedIncompleteIds: [],
        isDismissed: neverDismissed,
        wasCelebrated: () => true,
      });
      expect(presentation.type).toBe("none");
    }
  });

  it("próximo passo sempre vem do status operation-onboarding", () => {
    const status = getOperationSetupStatus({
      ...empty,
      hasFirstProductReady: true,
      hasMenuReady: true,
    });
    const presentation = resolveContextualPresentation({
      status,
      relevantStepIds: ["first_product"],
      watchedIncompleteIds: ["first_product"],
      isDismissed: neverDismissed,
      wasCelebrated: neverCelebrated,
    });
    expect(presentation.type).toBe("success");
    if (presentation.type === "success") {
      expect(presentation.nextStep).toEqual(status.nextStep);
    }
  });
});
