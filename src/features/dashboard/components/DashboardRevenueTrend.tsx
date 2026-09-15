import { formatCurrency, formatNumber } from "@/lib/format";
import type { PeriodEvolutionPoint } from "../types/dashboard";
import {
  buildAreaPath,
  buildNormalizedPoints,
  buildSvgPath,
  getChartMax,
} from "../utils/chartHelpers";
import { OsPanel } from "./os/OsPanel";

interface DashboardRevenueTrendProps {
  points: PeriodEvolutionPoint[];
  granularity: "hour" | "day";
  periodLabel: string;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const BASELINE_Y = CHART_HEIGHT - 32;

export default function DashboardRevenueTrend({
  points,
  granularity,
  periodLabel,
}: DashboardRevenueTrendProps) {
  const hasData = points.some((point) => point.salesCount > 0);
  const values = points.map((point) => point.revenue);
  const chartPoints = buildNormalizedPoints(values, CHART_WIDTH, CHART_HEIGHT);
  const linePath = buildSvgPath(chartPoints);
  const areaPath = buildAreaPath(chartPoints, BASELINE_Y);
  const maxRevenue = getChartMax(values);
  const description =
    granularity === "hour"
      ? "Evolução por hora local (da primeira hora com movimento até agora)."
      : "Evolução diária local no período selecionado.";

  return (
    <OsPanel
      title={`Evolução de vendas · ${periodLabel}`}
      description={description}
    >
      {!hasData ? (
        <div className="cosmo-os-empty">
          Nenhum dado de vendas neste período.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              className="h-52 w-full min-w-[280px] sm:h-56"
              role="img"
              aria-label={`Evolução de faturamento — ${periodLabel}`}
            >
              <defs>
                <linearGradient id="periodRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--os-blue)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--os-blue)" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="periodRevenueLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--os-blue)" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>

              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = 24 + (CHART_HEIGHT - 56) * ratio;
                return (
                  <line
                    key={ratio}
                    x1={16}
                    y1={y}
                    x2={CHART_WIDTH - 16}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {areaPath && <path d={areaPath} fill="url(#periodRevenueArea)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#periodRevenueLine)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {chartPoints.map((point, index) => {
                const source = points[index];
                return (
                  <g key={source.key}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={source.salesCount > 0 ? 4 : 2.5}
                      fill={
                        source.salesCount > 0
                          ? "var(--os-blue)"
                          : "rgba(148,163,184,0.45)"
                      }
                    >
                      <title>
                        {`${source.label}: ${formatCurrency(source.revenue)} · ${formatNumber(source.salesCount)} venda(s)`}
                      </title>
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {points.map((point) => {
              const heightPercent =
                maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={`bar-${point.key}`}
                  className="flex min-w-[2.25rem] flex-1 flex-col items-center gap-2"
                  title={`${point.label}: ${formatCurrency(point.revenue)}`}
                >
                  <div className="flex h-16 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-[color:var(--os-blue)]/70"
                      style={{
                        height: `${point.revenue > 0 ? Math.max(heightPercent, 6) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </OsPanel>
  );
}
