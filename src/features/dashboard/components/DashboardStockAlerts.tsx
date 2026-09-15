import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import type { StockAlert } from "@/features/inventory/types/inventory";
import { DashboardListSkeleton } from "./DashboardSkeleton";

interface DashboardStockAlertsProps {
  alerts: StockAlert[];
  loading?: boolean;
  embedded?: boolean;
}

export default function DashboardStockAlerts({
  alerts,
  loading = false,
  embedded = false,
}: DashboardStockAlertsProps) {
  const body = (
    <>
      {!embedded && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-400" size={18} />
            <h2 className="cosmo-os-panel__title">Estoque baixo</h2>
          </div>
          <Link
            to="/estoque"
            className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
          >
            Ver tudo
          </Link>
        </div>
      )}

      {embedded && (
        <div className="mb-3 flex justify-end">
          <Link
            to="/estoque"
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Ver tudo
          </Link>
        </div>
      )}

      {loading && <DashboardListSkeleton rows={3} />}

      {!loading && alerts.length === 0 && (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          Todos os produtos estão acima do estoque mínimo.
        </p>
      )}

      {!loading && alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.productId}
              className={`rounded-xl border p-3 ${
                alert.severity === "critical"
                  ? "border-red-400/20 bg-red-500/10"
                  : "border-amber-400/20 bg-amber-500/10"
              }`}
            >
              <p className="text-sm font-semibold text-slate-100">
                {alert.productName}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Atual: {alert.currentStock} · Mínimo: {alert.minStock}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return <div className="cosmo-os-panel p-5 sm:p-6">{body}</div>;
}
