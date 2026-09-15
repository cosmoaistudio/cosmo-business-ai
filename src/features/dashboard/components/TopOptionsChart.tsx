import { Layers } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { TopSellingOption } from "../types/dashboard";
import { DashboardListSkeleton, DashboardPanelSkeleton } from "./DashboardSkeleton";

interface TopOptionsChartProps {
  options: TopSellingOption[];
  loading?: boolean;
}

export default function TopOptionsChart({
  options,
  loading = false,
}: TopOptionsChartProps) {
  const maxQuantity = Math.max(
    ...options.map((option) => option.totalQuantity),
    1
  );

  if (loading) {
    return (
      <DashboardPanelSkeleton titleWidth="w-52">
        <DashboardListSkeleton rows={5} />
      </DashboardPanelSkeleton>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Opções mais vendidas
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Complementos e personalizações mais escolhidos no PDV.
        </p>
      </div>

      {options.length === 0 && (
        <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-500">
          Nenhuma opção vendida ainda.
        </div>
      )}

      {options.length > 0 && (
        <div className="space-y-5">
          {options.map((option, index) => {
            const widthPercent = (option.totalQuantity / maxQuantity) * 100;

            return (
              <div key={option.optionId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <Layers size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {index + 1}. {option.optionName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(option.totalRevenue)} em adicionais
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700">
                    {option.totalQuantity} un.
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.max(widthPercent, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
