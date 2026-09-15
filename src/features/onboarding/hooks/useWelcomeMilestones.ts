import { useOperationSetup } from "@/features/operation-onboarding";
import type { WelcomeMilestones } from "../types/onboarding";

/**
 * @deprecated Prefer useOperationSetup from @/features/operation-onboarding.
 * Adapter keeps WelcomeMilestones shape for any leftover consumers.
 */
export function useWelcomeMilestones(): {
  milestones: WelcomeMilestones;
  loading: boolean;
} {
  const { status, loading } = useOperationSetup();

  const firstProduct =
    status.steps.find((step) => step.id === "first_product")?.completed ??
    false;
  const firstSale =
    status.steps.find((step) => step.id === "first_sale")?.completed ?? false;
  const firstQrCode =
    status.steps.find((step) => step.id === "digital_order")?.completed ??
    false;

  return {
    loading,
    milestones: {
      firstProduct,
      firstSale,
      firstQrCode,
      firstOrder: firstSale,
      onboardingComplete: status.allComplete,
      progressPercent: status.progressPercent,
    },
  };
}
