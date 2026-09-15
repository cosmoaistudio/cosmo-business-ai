import { formatCurrency } from "@/lib/format";
import type { DashboardComparisons } from "../types/dashboard";
import ComparisonBadge from "./ComparisonBadge";
import { DashboardPanelSkeleton, DashboardSkeleton } from "./DashboardSkeleton";

interface DashboardComparisonsRowProps {
  comparisons: DashboardComparisons;
  loading?: boolean;
}

const COMPARISON_ITEMS = [
  {
    key: "revenueTodayVsYesterday" as const,
    title: "Hoje × Ontem",
    description: "Faturamento diário",
  },
  {
    key: "revenueWeekVsPreviousWeek" as const,
    title: "Semana × Anterior",
    description: "Faturamento semanal",
  },
  {
    key: "revenueMonthVsPreviousMonth" as const,
    title: "Mês × Anterior",
    description: "Faturamento mensal",
  },
];

export default function DashboardComparisonsRow({
  comparisons,
  loading = false,
}: DashboardComparisonsRowProps) {
  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-3">
        {COMPARISON_ITEMS.map((item) => (
          <DashboardPanelSkeleton key={item.key} titleWidth="w-40">
            <DashboardSkeleton className="h-10 w-full" />
          </DashboardPanelSkeleton>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {COMPARISON_ITEMS.map((item) => {
        const comparison = comparisons[item.key];

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
              <ComparisonBadge comparison={comparison} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Atual
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {formatCurrency(comparison.current)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Anterior
                </p>
                <p className="mt-1 text-lg font-bold text-slate-500">
                  {comparison.hasComparableHistory
                    ? formatCurrency(comparison.previous)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
