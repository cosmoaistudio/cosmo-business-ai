import type {
  OperationSetupStatus,
  OperationSetupStep,
  OperationSetupStepId,
} from "../types";

export type ContextualPresentation =
  | {
      type: "pending";
      step: OperationSetupStep;
    }
  | {
      type: "success";
      completedStep: OperationSetupStep;
      nextStep: OperationSetupStep | null;
      allComplete: boolean;
    }
  | {
      type: "none";
    };

/**
 * Pure decision for contextual banners on destination screens.
 * Completion always comes from OperationSetupStatus — never from dismiss flags.
 */
export function resolveContextualPresentation(input: {
  status: OperationSetupStatus;
  relevantStepIds: OperationSetupStepId[];
  isDismissed: (stepId: OperationSetupStepId) => boolean;
  wasCelebrated: (stepId: OperationSetupStepId) => boolean;
  watchedIncompleteIds: OperationSetupStepId[];
}): ContextualPresentation {
  const {
    status,
    relevantStepIds,
    isDismissed,
    wasCelebrated,
    watchedIncompleteIds,
  } = input;

  if (status.allComplete) {
    const justFinished = relevantStepIds.find(
      (id) =>
        watchedIncompleteIds.includes(id) &&
        status.steps.find((s) => s.id === id)?.completed === true &&
        !wasCelebrated(id)
    );
    if (justFinished) {
      const completedStep = status.steps.find((s) => s.id === justFinished);
      if (completedStep) {
        return {
          type: "success",
          completedStep,
          nextStep: null,
          allComplete: true,
        };
      }
    }
    return { type: "none" };
  }

  for (const id of watchedIncompleteIds) {
    if (!relevantStepIds.includes(id)) continue;
    const step = status.steps.find((s) => s.id === id);
    if (!step?.completed) continue;
    if (wasCelebrated(id)) continue;
    return {
      type: "success",
      completedStep: step,
      nextStep: status.nextStep,
      allComplete: status.allComplete,
    };
  }

  const pendingRelevant = relevantStepIds
    .map((id) => status.steps.find((s) => s.id === id))
    .filter((s): s is OperationSetupStep => Boolean(s && !s.completed));

  if (pendingRelevant.length === 0) {
    return { type: "none" };
  }

  const preferred =
    (status.nextStep &&
    relevantStepIds.includes(status.nextStep.id) &&
    !status.nextStep.completed
      ? status.nextStep
      : null) ?? pendingRelevant[0];

  if (!preferred || isDismissed(preferred.id)) {
    return { type: "none" };
  }

  return { type: "pending", step: preferred };
}

export const CONTEXTUAL_SUCCESS_COPY: Record<
  OperationSetupStepId,
  { title: string; description: string }
> = {
  first_product: {
    title: "Seu primeiro produto está pronto!",
    description:
      "Agora você pode permitir que seus clientes personalizem os pedidos.",
  },
  addons: {
    title: "Adicionais configurados!",
    description: "Agora seus clientes podem personalizar os pedidos.",
  },
  menu: {
    title: "Cardápio organizado!",
    description: "Seus produtos estão prontos para a próxima etapa.",
  },
  digital_order: {
    title: "Seu pedido digital está ativo!",
    description: "Seu cardápio já pode receber pedidos online.",
  },
  first_sale: {
    title: "Parabéns! Sua primeira venda foi concluída.",
    description:
      "Seu Cosmo Business está configurado e sua operação está pronta.",
  },
};
