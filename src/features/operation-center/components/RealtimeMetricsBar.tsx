import type { RealtimeMetrics } from "../types/operationCenter";
import { formatCurrency } from "@/lib/format";

interface RealtimeMetricsBarProps {
  metrics: RealtimeMetrics;
  compact?: boolean;
}

const ITEMS: Array<{
  key: keyof RealtimeMetrics;
  label: string;
  tone: string;
  format?: (value: number) => string;
}> = [
  { key: "ordersWaiting", label: "Aguardando", tone: "text-slate-200" },
  { key: "ordersPreparing", label: "Preparando", tone: "text-amber-200" },
  { key: "ordersReady", label: "Prontos", tone: "text-emerald-200" },
  { key: "ordersOverdue", label: "Atrasados", tone: "text-red-300" },
  {
    key: "averagePrepMinutes",
    label: "Tempo médio",
    tone: "text-blue-200",
    format: (v) => `${v} min`,
  },
  { key: "kitchenQueueSize", label: "Fila cozinha", tone: "text-violet-200" },
];

export default function RealtimeMetricsBar({
  metrics,
  compact = false,
}: RealtimeMetricsBarProps) {
  return (
    <div
      className={`grid gap-3 ${
        compact ? "grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      }`}
    >
      {ITEMS.map((item) => {
        const value = metrics[item.key];
        const display =
          item.format?.(value) ??
          (typeof value === "number" && item.key === "averagePrepMinutes"
            ? `${value} min`
            : String(value));

        return (
          <div
            key={item.key}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className={`mt-1 text-2xl font-black ${item.tone}`}>{display}</p>
          </div>
        );
      })}
    </div>
  );
}

export function RealtimeFinancePill({ total }: { total: number }) {
  return (
    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
      Hoje: <span className="font-bold">{formatCurrency(total)}</span>
    </div>
  );
}
