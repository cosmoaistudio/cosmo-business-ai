export { SaasProvider } from "./providers/SaasProvider";
export { MyPlanPage } from "./components/MyPlanPage";
export { SettingsHubPage } from "./components/SettingsHubPage";
export { HelpCenterPage } from "./components/HelpCenterPage";
export { DiagnosticsPage } from "./components/DiagnosticsPage";
export { FeedbackButton } from "./components/FeedbackButton";
export { OnboardingChecklistPanel } from "./components/OnboardingChecklistPanel";

export { useMyPlan } from "./hooks/useMyPlan";
export { useDiagnostics } from "./hooks/useDiagnostics";
export { useOnboardingChecklist } from "./hooks/useOnboardingChecklist";

export { SAAS_PLANS, getPlanById } from "./catalog/plans.catalog";
export { SAAS_ROLE_CATALOG } from "./catalog/roles.catalog";
export { createLimitsEngine } from "./services/limitsEngine";
export { subscriptionService } from "./services/subscription.service";
export { listBillingAdapters, getBillingAdapter } from "./services/billing/billingRegistry";

export type { SaasPlanId, SaasPlan, SaasSubscription } from "./types/plans";
export type { SaasLimitResource, LimitCheckResult } from "./types/limits";
export type { BillingProviderId, BillingProviderAdapter } from "./types/billing";
export type { SaasRoleCatalogId } from "./types/saasRoles";
export type { SettingsHubSectionId } from "./types/settingsHub";
