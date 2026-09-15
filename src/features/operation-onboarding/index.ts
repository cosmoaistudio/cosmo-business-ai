export { default as OperationSetupGuide } from "./components/OperationSetupGuide";
export { default as ContextualSetupBanner } from "./components/ContextualSetupBanner";
export { OperationSetupProvider } from "./providers/OperationSetupProvider";
export { useOperationSetup } from "./hooks/useOperationSetup";
export { useContextualSetup } from "./hooks/useContextualSetup";
export { operationOnboardingService } from "./services/operationOnboarding.service";
export {
  getOperationSetupStatus,
  assertOperationCtaIsNeverCompanyOnboarding,
} from "./utils/getOperationSetupStatus";
export {
  resolveContextualPresentation,
  CONTEXTUAL_SUCCESS_COPY,
} from "./utils/resolveContextualPresentation";
export type { ContextualPresentation } from "./utils/resolveContextualPresentation";
export {
  dismissContextualStep,
  isContextualStepDismissed,
  markContextualStepCelebrated,
  wasContextualStepCelebrated,
  buildContextualStorageScope,
} from "./utils/contextualDismiss";
export type {
  OperationSetupStatus,
  OperationSetupStep,
  OperationSetupStepId,
  OperationSetupSignals,
  OperationSetupStepMeta,
  OperationSetupStepVisualState,
} from "./types";
export {
  OPERATION_SETUP_STEPS,
  OPERATION_SETUP_STEP_META,
} from "./types";
