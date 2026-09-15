import type { ReactNode } from "react";
import { Skeleton } from "@/motion";

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({
  className = "",
}: DashboardSkeletonProps) {
  return <Skeleton className={className} />;
}

export function DashboardMetricCardSkeleton() {
  return (
    <div className="cosmo-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-32" />
    </div>
  );
}

export function DashboardChartSkeleton({ height = "h-56" }: { height?: string }) {
  const barHeights = ["h-[35%]", "h-[50%]", "h-[40%]", "h-[65%]", "h-[45%]", "h-[55%]", "h-[30%]"];

  return (
    <div className={`flex ${height} items-end gap-3 px-2`}>
      {barHeights.map((barHeight, index) => (
        <Skeleton
          key={index}
          className={`flex-1 rounded-t-2xl ${barHeight}`}
        />
      ))}
    </div>
  );
}

export function DashboardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPanelSkeleton({
  titleWidth = "w-48",
  children,
}: {
  titleWidth?: string;
  children?: ReactNode;
}) {
  return (
    <div className="cosmo-card p-6">
      <Skeleton className={`h-6 ${titleWidth}`} />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6">{children ?? <DashboardChartSkeleton />}</div>
    </div>
  );
}
