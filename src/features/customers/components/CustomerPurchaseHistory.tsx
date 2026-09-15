import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/features/pdv/types/sale";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { CustomerPurchase } from "../types/customer";

interface CustomerPurchaseHistoryProps {
  purchases: CustomerPurchase[];
  loading?: boolean;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerPurchaseHistory({
  purchases,
  loading = false,
}: CustomerPurchaseHistoryProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        Carregando histórico de compras...
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        Este cliente ainda não possui compras registradas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">
                Venda #{purchase.sale_number}
              </p>
              <p className="text-sm text-slate-500">
                {formatDateTime(purchase.created_at)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(purchase.total)}
              </p>
              {purchase.payment_method && (
                <p className="text-xs text-slate-500">
                  {PAYMENT_METHOD_LABELS[
                    purchase.payment_method as PaymentMethod
                  ] ?? purchase.payment_method}
                </p>
              )}
            </div>
          </div>

          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {purchase.items.map((item, index) => (
              <li key={`${purchase.id}-${index}`}>
                <div>
                  {item.quantity}x {item.product_name} —{" "}
                  {formatCurrency(item.subtotal)}
                </div>

                {item.options && item.options.length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-4 text-xs text-slate-500">
                    {item.options.map((option, optionIndex) => (
                      <li key={`${purchase.id}-${index}-${optionIndex}`}>
                        + {option.option_name} ({option.quantity}x{" "}
                        {formatCurrency(option.price)}) —{" "}
                        {formatCurrency(option.subtotal)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          {purchase.observation && (
            <p className="mt-3 text-sm text-slate-500">
              Obs.: {purchase.observation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
