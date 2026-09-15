import { AlertTriangle } from "lucide-react";
import Card from "@/components/shared/Card";
import type { StockAlert } from "../types/inventory";

interface StockAlertsListProps {
  alerts: StockAlert[];
  loading?: boolean;
  onEditMinStock?: (alert: StockAlert) => void;
}

export default function StockAlertsList({
  alerts,
  loading = false,
  onEditMinStock,
}: StockAlertsListProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="text-amber-500" size={20} />
        <h2 className="text-lg font-bold text-slate-900">Alertas de estoque</h2>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Estoque sob controle
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Nenhum produto abaixo do mínimo. Continue monitorando após as vendas
            do dia.
          </p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.productId}
              className={`flex items-center justify-between rounded-2xl border p-4 ${
                alert.severity === "critical"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {alert.productName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Atual: {alert.currentStock} · Mínimo: {alert.minStock}
                </p>
              </div>

              {onEditMinStock && (
                <button
                  type="button"
                  onClick={() => onEditMinStock(alert)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Ajustar mínimo
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
