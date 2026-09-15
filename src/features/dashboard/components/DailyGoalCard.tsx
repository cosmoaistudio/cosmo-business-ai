import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { DailyGoalStats } from "../types/dashboard";
import { DashboardMetricCardSkeleton } from "./DashboardSkeleton";

interface DailyGoalCardProps {
  dailyGoal: DailyGoalStats;
  loading?: boolean;
  animationDelay?: number;
}

export default function DailyGoalCard({
  dailyGoal,
  loading = false,
  animationDelay = 0,
}: DailyGoalCardProps) {
  if (loading) {
    return <DashboardMetricCardSkeleton />;
  }

  const progress = Math.min(dailyGoal.progressPercent, 100);
  const isComplete = dailyGoal.progressPercent >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: animationDelay }}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-12 sm:w-12">
          <Target size={22} />
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isComplete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {formatPercent(dailyGoal.progressPercent)}
        </span>
      </div>

      <h3 className="mt-5 text-sm font-medium text-slate-500">Meta diária</h3>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        {formatCurrency(dailyGoal.current)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Meta: {formatCurrency(dailyGoal.target)}
      </p>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: animationDelay + 0.2 }}
            className={`h-full rounded-full ${
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }`}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {isComplete
            ? "Meta do dia atingida ou superada."
            : `${formatPercent(100 - progress)} restante para a meta.`}
        </p>
      </div>
    </motion.div>
  );
}
