import { formatCurrency } from "@/lib/format";
import type { CashFlowPoint } from "../types/finance";

interface CashFlowChartProps {
  data: CashFlowPoint[];
  loading?: boolean;
}

export default function CashFlowChart({
  data,
  loading = false,
}: CashFlowChartProps) {
  const maxValue = Math.max(
    ...data.flatMap((point) => [point.income, point.expenses, Math.abs(point.balance)]),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Fluxo de caixa</h2>
        <p className="mt-1 text-sm text-slate-500">
          Entradas, saídas e saldo diário — últimos 7 dias.
        </p>
      </div>

      {loading && (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          Carregando fluxo de caixa...
        </div>
      )}

      {!loading && (
        <div className="grid gap-4 md:grid-cols-7">
          {data.map((point) => (
            <div
              key={point.date}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <p className="text-sm font-semibold text-slate-700">
                {point.label}
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Entradas</span>
                    <span>{formatCurrency(point.income)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.max((point.income / maxValue) * 100, point.income > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Saídas</span>
                    <span>{formatCurrency(point.expenses)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{
                        width: `${Math.max((point.expenses / maxValue) * 100, point.expenses > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                </div>

                <p
                  className={`text-sm font-bold ${
                    point.balance >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  Saldo: {formatCurrency(point.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
