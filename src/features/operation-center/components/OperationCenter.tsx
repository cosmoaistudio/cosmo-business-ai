import { SkeletonPage } from "@/motion";
import type { OperationCenterData, OperationPeriod } from "../types/operationCenter";
import OperationCenterShell from "./OperationCenterShell";
import type { OperationScreen, OperationViewMode } from "../types/operationCenter";

interface OperationCenterProps {
  data: OperationCenterData | null;
  loading: boolean;
  period: OperationPeriod;
  screen: OperationScreen;
  viewMode: OperationViewMode;
  onPeriodChange: (period: OperationPeriod) => void;
  onScreenChange: (screen: OperationScreen) => void;
  onViewModeChange: (mode: OperationViewMode) => void;
}

export default function OperationCenter(props: OperationCenterProps) {
  if (props.loading && !props.data) {
    return <SkeletonPage label="Carregando centro de operações" />;
  }

  return <OperationCenterShell {...props} />;
}
