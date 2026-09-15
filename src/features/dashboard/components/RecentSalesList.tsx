import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import type { RecentSale } from "../types/dashboard";
import { DashboardListSkeleton } from "./DashboardSkeleton";

interface RecentSalesListProps {
  sales: RecentSale[];
  loading?: boolean;
  embedded?: boolean;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentSalesList({
  sales,
  loading = false,
  embedded = false,
}: RecentSalesListProps) {
  const body = (
    <>
      {!embedded && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="cosmo-os-panel__title">Últimas vendas</h2>
            <p className="cosmo-os-panel__desc">Vendas concluídas no PDV.</p>
          </div>
          <Link
            to="/pdv"
            className="shrink-0 text-sm font-medium text-indigo-300 hover:text-indigo-200"
          >
            Ir ao PDV
          </Link>
        </div>
      )}

      {embedded && (
        <div className="mb-3 flex justify-end">
          <Link
            to="/pdv"
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Ir ao PDV
          </Link>
        </div>
      )}

      {loading && <DashboardListSkeleton rows={6} />}

      {!loading && sales.length === 0 && (
        <div className="cosmo-os-empty flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-200">
              Você ainda não possui vendas.
            </p>
            <p className="mt-1 text-slate-500">
              Crie a primeira venda no PDV para ver o fluxo em tempo real.
            </p>
          </div>
          <Link
            to="/pdv"
            className="inline-flex h-9 items-center rounded-lg bg-sky-500 px-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Criar primeira venda
          </Link>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="divide-y divide-white/5">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100">
                  Venda #{sale.saleNumber || "—"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {sale.customerName ?? "Consumidor final"} ·{" "}
                  {formatDateTime(sale.createdAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">
                {formatCurrency(sale.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return <div className="cosmo-os-panel p-5 sm:p-6">{body}</div>;
}
