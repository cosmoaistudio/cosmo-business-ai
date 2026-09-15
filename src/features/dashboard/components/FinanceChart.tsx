import { CashFlowChart } from "@/features/finance";
import type { CashFlowPoint } from "@/features/finance/types/finance";
import { DashboardChartSkeleton, DashboardPanelSkeleton } from "./DashboardSkeleton";

interface FinanceChartProps {
  data: CashFlowPoint[];
  loading?: boolean;
}

export default function FinanceChart({ data, loading = false }: FinanceChartProps) {
  if (loading) {
    return (
      <DashboardPanelSkeleton titleWidth="w-40">
        <DashboardChartSkeleton />
      </DashboardPanelSkeleton>
    );
  }

  return <CashFlowChart data={data} loading={false} />;
}
