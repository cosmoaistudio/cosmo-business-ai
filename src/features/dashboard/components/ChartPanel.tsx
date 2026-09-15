import type { ReactNode } from "react";
import { DashboardChartSkeleton, DashboardPanelSkeleton } from "./DashboardSkeleton";

interface ChartPanelProps {
  title: string;
  description: string;
  loading?: boolean;
  children: ReactNode;
}

export default function ChartPanel({
  title,
  description,
  loading = false,
  children,
}: ChartPanelProps) {
  if (loading) {
    return (
      <DashboardPanelSkeleton titleWidth="w-56">
        <DashboardChartSkeleton />
      </DashboardPanelSkeleton>
    );
  }

  return (
    <div className="cosmo-os-panel p-5 sm:p-6">
      <div className="relative mb-5">
        <h2 className="cosmo-os-panel__title">{title}</h2>
        <p className="cosmo-os-panel__desc">{description}</p>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
