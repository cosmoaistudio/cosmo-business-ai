import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { formatPercent } from "@/lib/format";
import type { PeriodComparison } from "../types/dashboard";

interface ComparisonBadgeProps {
  comparison: PeriodComparison;
  invertColors?: boolean;
  className?: string;
}

export default function ComparisonBadge({
  comparison,
  invertColors = false,
  className = "",
}: ComparisonBadgeProps) {
  const isPositive = comparison.trend === "up";
  const isNegative = comparison.trend === "down";

  let colorClass = "bg-slate-100 text-slate-600";

  if (isPositive) {
    colorClass = invertColors
      ? "bg-red-50 text-red-700"
      : "bg-emerald-50 text-emerald-700";
  }

  if (isNegative) {
    colorClass = invertColors
      ? "bg-emerald-50 text-emerald-700"
      : "bg-red-50 text-red-700";
  }

  if (!comparison.hasComparableHistory) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ${className}`}
      >
        <Minus size={14} />
        Sem histórico
      </span>
    );
  }

  const Icon =
    comparison.trend === "up"
      ? TrendingUp
      : comparison.trend === "down"
        ? TrendingDown
        : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${colorClass} ${className}`}
    >
      <Icon size={14} />
      {formatPercent(comparison.changePercent)}
    </span>
  );
}
