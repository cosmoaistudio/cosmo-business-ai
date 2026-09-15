import type { OperationCenterData } from "../../types/operationCenter";
import RealtimeMetricsBar from "../RealtimeMetricsBar";
import LiveTimeline from "../LiveTimeline";
import AlertCenter from "../AlertCenter";

interface ProductionScreenProps {
  data: OperationCenterData;
  tvMode?: boolean;
}

export default function ProductionScreen({
  data,
  tvMode = false,
}: ProductionScreenProps) {
  const kitchenAlerts = data.alerts.filter((alert) =>
    ["order_overdue", "kitchen_stalled", "large_queue"].includes(alert.type)
  );

  return (
    <div className="space-y-6">
      <RealtimeMetricsBar metrics={data.realtime} compact={tvMode} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Aguardando" value={data.realtime.ordersWaiting} />
        <StatCard label="Preparando" value={data.realtime.ordersPreparing} tone="amber" />
        <StatCard label="Prontos" value={data.realtime.ordersReady} tone="emerald" />
      </div>

      <AlertCenter alerts={kitchenAlerts.length ? kitchenAlerts : data.alerts} tvMode={tvMode} />

      <LiveTimeline
        events={data.liveTimeline.filter((e) =>
          ["order_delivered", "sale", "print_sent"].includes(e.type)
        )}
        live
        tvMode={tvMode}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "amber" | "emerald";
}) {
  const tones = {
    slate: "text-white",
    amber: "text-amber-200",
    emerald: "text-emerald-200",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-4xl font-black ${tones[tone]}`}>{value}</p>
    </div>
  );
}
