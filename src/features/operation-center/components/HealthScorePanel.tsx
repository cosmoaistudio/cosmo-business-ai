import type { HealthScoreBreakdown } from "../types/operationCenter";

interface HealthScorePanelProps {
  health: HealthScoreBreakdown;
  tvMode?: boolean;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`font-semibold ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${scoreBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function HealthScorePanel({
  health,
  tvMode = false,
}: HealthScorePanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
        Health Score
      </p>
      <h2 className={`mt-1 font-bold ${tvMode ? "text-2xl" : "text-lg"}`}>
        Operação
      </h2>

      <div className="mt-6 flex items-end gap-3">
        <span className={`font-black ${scoreColor(health.overall)} ${tvMode ? "text-7xl" : "text-5xl"}`}>
          {health.overall}
        </span>
        <span className="pb-2 text-sm text-slate-300">/ 100</span>
      </div>

      <div className="mt-6 space-y-4">
        <MetricBar label="Pedidos" value={health.orders} />
        <MetricBar label="Estoque" value={health.stock} />
        <MetricBar label="Desktop" value={health.desktop} />
        <MetricBar label="Kitchen" value={health.kitchen} />
        <MetricBar label="Realtime" value={health.realtime} />
        <MetricBar label="Financeiro" value={health.finance} />
      </div>
    </div>
  );
}
