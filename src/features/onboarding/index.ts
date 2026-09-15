export * from "./hooks/useOnboarding";
export * from "./hooks/useWelcomeMilestones";
export * from "./services/onboarding.service";
export type * from "./types/onboarding";
export {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEP_DESCRIPTIONS,
  BUSINESS_SEGMENT_LABELS,
  TOTAL_ONBOARDING_STEPS,
} from "./types/onboarding";

export { default as OnboardingWizard } from "./components/OnboardingWizard";
export { default as OnboardingProgressBar } from "./components/OnboardingProgressBar";
export { default as WelcomeDashboard } from "./components/WelcomeDashboard";

export {
  loadOnboardingState,
  isOnboardingComplete,
  getOnboardingProgressPercent,
} from "./utils/onboardingStorage";
