/**
 * @deprecated Prefer OperationSetupGuide from @/features/operation-onboarding.
 * Kept as a thin adapter so older imports do not crash; no longer drives company setup copy.
 */
import {
  OperationSetupGuide,
  useOperationSetup,
} from "@/features/operation-onboarding";
import type { WelcomeMilestones } from "../types/onboarding";

interface WelcomeDashboardProps {
  milestones?: WelcomeMilestones;
  loading?: boolean;
}

export default function WelcomeDashboard({
  loading: loadingProp,
}: WelcomeDashboardProps) {
  const { status, loading } = useOperationSetup();
  return (
    <OperationSetupGuide
      status={status}
      loading={loadingProp ?? loading}
    />
  );
}
