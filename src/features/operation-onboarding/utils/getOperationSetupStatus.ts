import {
  OPERATION_SETUP_STEPS,
  type OperationSetupSignals,
  type OperationSetupStatus,
  type OperationSetupStep,
  type OperationSetupStepId,
  type OperationSetupStepVisualState,
} from "../types";

function isCompleted(
  id: OperationSetupStepId,
  signals: OperationSetupSignals
): boolean {
  switch (id) {
    case "first_product":
      return signals.hasFirstProductReady;
    case "addons":
      return signals.hasAddonGroup;
    case "menu":
      return signals.hasMenuReady;
    case "digital_order":
      return signals.hasDigitalOrderConfigured;
    case "first_sale":
      return signals.hasFirstSale;
    default:
      return false;
  }
}

/**
 * Single source of truth for Dashboard operation getting-started progress.
 * Completion is derived only from real signals — never manual toggles.
 */
export function getOperationSetupStatus(
  signals: OperationSetupSignals
): OperationSetupStatus {
  const steps: OperationSetupStep[] = OPERATION_SETUP_STEPS.map((meta) => ({
    id: meta.id,
    title: meta.title,
    description: meta.description,
    tip: meta.tip,
    ctaLabel: meta.ctaLabel,
    href: meta.href,
    educationSteps: [...meta.educationSteps],
    shortLabel: meta.shortLabel,
    order: meta.order,
    completed: isCompleted(meta.id, signals),
    visualState: "upcoming" as OperationSetupStepVisualState,
  }));

  const nextIndex = steps.findIndex((step) => !step.completed);

  const withVisual = steps.map((step, index) => {
    let visualState: OperationSetupStepVisualState = "upcoming";
    if (step.completed) visualState = "completed";
    else if (index === nextIndex) visualState = "current";
    return { ...step, visualState };
  });

  const completedSteps = withVisual.filter((step) => step.completed).length;
  const totalSteps = withVisual.length;
  const progressPercent =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  const nextStep =
    nextIndex >= 0 ? (withVisual[nextIndex] ?? null) : null;
  const otherSteps = withVisual.filter((step) => step.id !== nextStep?.id);

  return {
    totalSteps,
    completedSteps,
    progressPercent,
    allComplete: completedSteps === totalSteps && totalSteps > 0,
    steps: withVisual,
    nextStep,
    otherSteps,
  };
}

export function assertOperationCtaIsNeverCompanyOnboarding(
  href: string | null | undefined
): boolean {
  return href !== "/onboarding" && href !== "/assistente";
}
