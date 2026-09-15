import type { OperationCenterData } from "../../types/operationCenter";
import { OperationMetricCards, OperationSummaryBar } from "../OperationMetricCards";
import LiveTimeline from "../LiveTimeline";
import QuickActionsCard from "../QuickActionsCard";

interface OperationScreenViewProps {
  data: OperationCenterData;
}

export default function OperationScreenView({ data }: OperationScreenViewProps) {
  return (
    <div className="space-y-6">
      <OperationSummaryBar summary={data.summary} />
      <OperationMetricCards metrics={data.metrics} />
      <LiveTimeline events={data.timeline} />
      <QuickActionsCard />
    </div>
  );
}
