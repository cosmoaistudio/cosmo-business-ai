import { AlertTriangle } from "lucide-react";
import type { CosmoInsight } from "../types/cosmoAi";
import InsightCard from "./InsightCard";

interface AlertsListProps {
  alerts: CosmoInsight[];
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
  loading?: boolean;
}

export default function AlertsList({
  alerts,
  onResolve,
  onIgnore,
  loading,
}: AlertsListProps) {
  return (
    <section className="cosmo-card border-red-100 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-red-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Alertas</h2>
        {!loading && alerts.length > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
            {alerts.length}
          </span>
        )}
      </div>

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Verificando alertas...</p>
      )}

      {!loading && alerts.length === 0 && (
        <p className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center text-sm text-emerald-700">
          Nenhum alerta ativo.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {!loading &&
          alerts.map((alert) => (
            <InsightCard
              key={alert.id}
              insight={alert}
              onResolve={onResolve}
              onIgnore={onIgnore}
            />
          ))}
      </div>
    </section>
  );
}
