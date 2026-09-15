import { formatCurrency, formatNumber } from "@/lib/format";
import type { WeekdayPerformancePoint } from "../types/dashboard";
import { getChartMax } from "../utils/chartHelpers";
import { OsPanel } from "./os/OsPanel";

interface DashboardWeekdayPerformanceProps {
  points: WeekdayPerformancePoint[];
  periodLabel: string;
}

export default function DashboardWeekdayPerformance({
  points,
  periodLabel,
}: DashboardWeekdayPerformanceProps) {
  const hasData = points.some((point) => point.salesCount > 0);
  const maxRevenue = getChartMax(points.map((point) => point.revenue));

  return (
    <OsPanel
      title={`Desempenho por dia · ${periodLabel}`}
      description="Padrão de faturamento por dia da semana (ordem fixa Seg→Dom)."
    >
      {!hasData ? (
        <div className="cosmo-os-empty">
          Sem vendas no período para analisar dias da semana.
        </div>
      ) : (
        <div className="space-y-3">
          {points.map((point) => {
            const widthPercent =
              maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
            const ticketLabel =
              point.salesCount > 0
                ? formatCurrency(point.averageTicket)
                : "—";

            return (
              <div key={point.weekdayIndex} className="dashboard-weekday-row">
                <div className="dashboard-weekday-row__meta">
                  <p className="dashboard-weekday-row__label">{point.label}</p>
                  <p className="dashboard-weekday-row__sub">
                    {formatNumber(point.salesCount)} venda(s) · ticket {ticketLabel}
                  </p>
                </div>
                <div className="dashboard-weekday-row__bar-wrap" aria-hidden>
                  <div
                    className="dashboard-weekday-row__bar"
                    style={{ width: `${Math.max(widthPercent, point.revenue > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <p className="dashboard-weekday-row__value">
                  {point.revenue > 0 ? formatCurrency(point.revenue) : "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </OsPanel>
  );
}
