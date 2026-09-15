import {
  CalendarDays,
  Package,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

import { OsPanel } from "./os/OsPanel";
import type {
  DashboardInsight,
  DashboardInsightCategory,
  DashboardInsightTone,
} from "../utils/buildDashboardPeriodInsights";

interface DashboardPeriodInsightsProps {
  insights: DashboardInsight[];
  periodLabel: string;
}

const ICONS: Record<DashboardInsightCategory, ReactNode> = {
  growth: <TrendingUp size={16} />,
  decline: <TrendingDown size={16} />,
  trend: <TrendingUp size={16} />,
  concentration: <PieChart size={16} />,
  product: <Package size={16} />,
  calendar: <CalendarDays size={16} />,
  weekday: <CalendarDays size={16} />,
};

function toneClass(tone: DashboardInsightTone): string {
  if (tone === "positive") return "dashboard-insight__item--positive";
  if (tone === "attention") return "dashboard-insight__item--attention";
  return "dashboard-insight__item--info";
}

/**
 * Renders deterministic period insights. Returns null when empty.
 */
export default function DashboardPeriodInsights({
  insights,
  periodLabel,
}: DashboardPeriodInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <OsPanel
      title={`Insights da operação · ${periodLabel}`}
      description="Observações objetivas a partir dos dados do período selecionado."
    >
      <ul className="dashboard-insight__list">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className={`dashboard-insight__item ${toneClass(insight.tone)}`}
          >
            <span className="dashboard-insight__icon" aria-hidden>
              {ICONS[insight.category]}
            </span>
            <div className="dashboard-insight__body">
              <p className="dashboard-insight__title">{insight.title}</p>
              <p className="dashboard-insight__desc">{insight.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </OsPanel>
  );
}
