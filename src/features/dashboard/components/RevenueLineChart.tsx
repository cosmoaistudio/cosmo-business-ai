import { formatCurrency } from "@/lib/format";
import type { SalesDayPoint } from "../types/dashboard";
import {
  buildAreaPath,
  buildNormalizedPoints,
  buildSvgPath,
} from "../utils/chartHelpers";
import ChartPanel from "./ChartPanel";

interface RevenueLineChartProps {
  data: SalesDayPoint[];
  loading?: boolean;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const BASELINE_Y = CHART_HEIGHT - 32;

export default function RevenueLineChart({
  data,
  loading = false,
}: RevenueLineChartProps) {
  const values = data.map((point) => point.revenue);
  const points = buildNormalizedPoints(values, CHART_WIDTH, CHART_HEIGHT);
  const linePath = buildSvgPath(points);
  const areaPath = buildAreaPath(points, BASELINE_Y);

  return (
    <ChartPanel
      title="Receita nos últimos 7 dias"
      description="Evolução diária do faturamento."
      loading={loading}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-56 w-full min-w-[320px]"
          role="img"
          aria-label="Gráfico de faturamento dos últimos 7 dias"
        >
          <defs>
            <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="revenueLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
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

          {areaPath && <path d={areaPath} fill="url(#revenueArea)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#revenueLine)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => (
            <g key={data[index].date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={5}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={3}
              />
              <title>
                {data[index].label}: {formatCurrency(data[index].revenue)}
              </title>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {data.map((point) => (
          <div key={point.date} className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              {point.label}
            </p>
            <p className="truncate text-[10px] text-slate-400 sm:text-xs">
              {point.revenue > 0 ? formatCurrency(point.revenue) : "—"}
            </p>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}
