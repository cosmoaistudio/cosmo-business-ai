import type { KitchenMetrics } from "../types/kitchenDisplay.types";

interface KitchenStatsBarProps {
  metrics: KitchenMetrics;
}

export default function KitchenStatsBar({ metrics }: KitchenStatsBarProps) {
  const items = [
    { label: "Tempo médio", value: `${metrics.averagePrepMinutes} min` },
    { label: "Atrasados", value: String(metrics.overdueCount), alert: metrics.overdueCount > 0 },
    { label: "Em preparo", value: String(metrics.preparingCount) },
    { label: "Prontos", value: String(metrics.readyCount) },
    { label: "Na fila", value: String(metrics.queueCount) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border px-4 py-3 ${
            item.alert
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p
            className={`text-2xl font-black ${
              item.alert ? "text-red-600" : "text-slate-900"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
