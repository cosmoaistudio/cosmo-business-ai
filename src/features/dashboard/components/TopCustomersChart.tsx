import { formatCurrency } from "@/lib/format";
import type { TopCustomer } from "../types/dashboard";

interface TopCustomersChartProps {
  customers: TopCustomer[];
  loading?: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export default function TopCustomersChart({
  customers,
  loading = false,
}: TopCustomersChartProps) {
  const maxSpent = Math.max(...customers.map((customer) => customer.totalSpent), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Melhores clientes
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranking por total gasto no PDV.
        </p>
      </div>

      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">
          Carregando ranking...
        </div>
      )}

      {!loading && customers.length === 0 && (
        <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-500">
          Nenhuma venda vinculada a clientes ainda.
        </div>
      )}

      {!loading && customers.length > 0 && (
        <div className="space-y-5">
          {customers.map((customer, index) => {
            const widthPercent = (customer.totalSpent / maxSpent) * 100;

            return (
              <div key={customer.customerId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {index + 1}. {customer.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.purchaseCount} compra(s) · última em{" "}
                      {formatDate(customer.lastPurchaseAt)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${Math.max(widthPercent, 6)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
