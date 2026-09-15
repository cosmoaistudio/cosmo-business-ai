export const SAAS_ONBOARDING_STEP_IDS = [
  "signup",
  "company",
  "products",
  "pdv",
  "digital_order",
  "printing",
  "first_order",
  "first_customer",
] as const;

export type SaasOnboardingStepId = (typeof SAAS_ONBOARDING_STEP_IDS)[number];

export interface SaasOnboardingStep {
  id: SaasOnboardingStepId;
  label: string;
  description: string;
  href?: string;
  done: boolean;
}
