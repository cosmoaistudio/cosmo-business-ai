import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Card, type CardProps } from "../Card";
import { Skeleton } from "../Skeleton";

export type MetricDeltaType = "up" | "down" | "neutral";

export interface MetricCardProps extends Omit<CardProps, "children"> {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaType?: MetricDeltaType;
  icon?: ReactNode;
  loading?: boolean;
}

const deltaClass: Record<MetricDeltaType, string> = {
  up: "cosmo-v2-metric__delta--up",
  down: "cosmo-v2-metric__delta--down",
  neutral: "cosmo-v2-metric__delta--neutral",
};

export function MetricCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  icon,
  loading = false,
  className,
  ...cardProps
}: MetricCardProps) {
  return (
    <Card className={cn("cosmo-v2-metric", className)} {...cardProps}>
      <div className="flex items-start justify-between gap-3">
        <span className="cosmo-v2-metric__label">{label}</span>
        {icon ? (
          <span className="text-[var(--cosmo-text-tertiary)]">{icon}</span>
        ) : null}
      </div>

      {loading ? (
        <>
          <Skeleton height="2.25rem" width="60%" />
          <Skeleton height="0.875rem" width="40%" />
        </>
      ) : (
        <>
          <div className="cosmo-v2-metric__value">{value}</div>
          {delta ? (
            <span className={cn("text-sm font-medium", deltaClass[deltaType])}>
              {delta}
            </span>
          ) : null}
        </>
      )}
    </Card>
  );
}
