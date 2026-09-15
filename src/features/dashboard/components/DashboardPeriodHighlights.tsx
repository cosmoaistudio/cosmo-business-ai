import { CalendarDays, Trophy } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { PeriodHighlights } from "../types/dashboard";
import { OsPanel } from "./os/OsPanel";

interface DashboardPeriodHighlightsProps {
  highlights: PeriodHighlights;
  periodLabel: string;
}

export default function DashboardPeriodHighlights({
  highlights,
  periodLabel,
}: DashboardPeriodHighlightsProps) {
  const { bestWeekday, bestCalendarDay } = highlights;

  if (!bestWeekday && !bestCalendarDay) {
    return null;
  }

  return (
    <OsPanel
      title={`Destaques · ${periodLabel}`}
      description="Resumo dos melhores resultados reais no período."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {bestWeekday && (
          <div className="dashboard-highlight-card">
            <span className="dashboard-highlight-card__icon" aria-hidden>
              <Trophy size={16} />
            </span>
            <div>
              <p className="dashboard-highlight-card__eyebrow">
                {bestWeekday.summaryLabel}
              </p>
              <p className="dashboard-highlight-card__title">
                {bestWeekday.label}
              </p>
              <p className="dashboard-highlight-card__meta">
                {formatCurrency(bestWeekday.revenue)} ·{" "}
                {formatNumber(bestWeekday.salesCount)} venda(s)
              </p>
            </div>
          </div>
        )}

        {bestCalendarDay && (
          <div className="dashboard-highlight-card">
            <span className="dashboard-highlight-card__icon" aria-hidden>
              <CalendarDays size={16} />
            </span>
            <div>
              <p className="dashboard-highlight-card__eyebrow">
                Melhor dia do período
              </p>
              <p className="dashboard-highlight-card__title">
                {bestCalendarDay.label}
              </p>
              <p className="dashboard-highlight-card__meta">
                {formatCurrency(bestCalendarDay.revenue)} ·{" "}
                {formatNumber(bestCalendarDay.salesCount)} venda(s)
              </p>
            </div>
          </div>
        )}
      </div>
    </OsPanel>
  );
}
