import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { Sparkline } from "@/design-system";

import ComparisonBadge from "./ComparisonBadge";
import { DashboardMetricCardSkeleton } from "./DashboardSkeleton";
import type { PeriodComparison } from "../types/dashboard";

type MetricAccent =
  | "blue"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "cyan"
  | "indigo"
  | "orange";

const ACCENT_STYLES: Record<
  MetricAccent,
  { icon: string; ring: string; glow: string }
> = {
  blue: {
    icon: "bg-indigo-500/20 text-indigo-300",
    ring: "hover:border-indigo-500/30",
    glow: "from-indigo-500/10",
  },
  emerald: {
    icon: "bg-emerald-500/15 text-emerald-300",
    ring: "hover:border-emerald-500/30",
    glow: "from-emerald-500/10",
  },
  violet: {
    icon: "bg-violet-500/15 text-violet-300",
    ring: "hover:border-violet-500/30",
    glow: "from-violet-500/10",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-300",
    ring: "hover:border-amber-500/30",
    glow: "from-amber-500/10",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-300",
    ring: "hover:border-rose-500/30",
    glow: "from-rose-500/10",
  },
  cyan: {
    icon: "bg-cyan-500/15 text-cyan-300",
    ring: "hover:border-cyan-500/30",
    glow: "from-cyan-500/10",
  },
  indigo: {
    icon: "bg-indigo-500/20 text-indigo-300",
    ring: "hover:border-indigo-500/30",
    glow: "from-indigo-500/10",
  },
  orange: {
    icon: "bg-orange-500/15 text-orange-300",
    ring: "hover:border-orange-500/30",
    glow: "from-orange-500/10",
  },
};

interface DashboardMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  accent?: MetricAccent;
  comparison?: PeriodComparison;
  sparklineValues?: number[];
  loading?: boolean;
  animationDelay?: number;
}

export default function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon,
  accent = "blue",
  comparison,
  sparklineValues,
  loading = false,
  animationDelay = 0,
}: DashboardMetricCardProps) {
  if (loading) {
    return <DashboardMetricCardSkeleton />;
  }

  const styles = ACCENT_STYLES[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: animationDelay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`cosmo-premium-card rounded-2xl p-5 sm:p-6 ${styles.ring}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${styles.glow} to-transparent`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${styles.icon}`}
        >
          {icon}
        </div>

        {comparison && <ComparisonBadge comparison={comparison} />}
      </div>

      <h3 className="relative mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <p className="relative mt-1 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
        {value}
      </p>

      {subtitle && (
        <p className="relative mt-1 text-sm text-slate-500">{subtitle}</p>
      )}

      {sparklineValues && sparklineValues.length > 1 && (
        <div className="relative mt-4 flex justify-end opacity-80">
          <Sparkline values={sparklineValues} width={88} height={24} />
        </div>
      )}
    </motion.div>
  );
}
