import { formatNumber } from "@/lib/format";
import type { SalesDayPoint } from "../types/dashboard";
import { getChartMax } from "../utils/chartHelpers";
import ChartPanel from "./ChartPanel";

interface SalesChartProps {
  data: SalesDayPoint[];
  loading?: boolean;
}

export default function SalesChart({ data, loading = false }: SalesChartProps) {
  const maxSales = getChartMax(data.map((point) => point.salesCount));

  return (
    <ChartPanel
      title="Pedidos — últimos 7 dias"
      description="Volume diário de vendas concluídas."
      loading={loading}
    >
      <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2 sm:gap-3">
        {data.map((point) => {
          const heightPercent = (point.salesCount / maxSales) * 100;

          return (
            <div
              key={point.date}
              className="flex min-w-[72px] flex-1 flex-col items-center gap-3"
            >
              <span className="text-xs font-medium text-slate-400">
                {point.salesCount > 0 ? formatNumber(point.salesCount) : "—"}
              </span>

              <div className="flex h-40 w-full items-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                  style={{
                    height: `${point.salesCount > 0 ? Math.max(heightPercent, 8) : 0}%`,
                  }}
                  title={`${point.salesCount} venda(s)`}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">
                  {point.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ChartPanel>
  );
}
