import { ArrowDownCircle, Scale, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import type { DashboardFinanceStats } from "../types/dashboard";

interface DashboardFinanceSummaryProps {
  finance: DashboardFinanceStats;
  loading?: boolean;
}

export default function DashboardFinanceSummary({
  finance,
  loading = false,
}: DashboardFinanceSummaryProps) {
  const items = [
    {
      title: "Entradas",
      value: loading ? "..." : formatCurrency(finance.totalIncome),
      subtitle: loading ? "" : `${formatCurrency(finance.incomeToday)} hoje`,
      icon: Wallet,
      color: "text-emerald-600",
    },
    {
      title: "Despesas",
      value: loading ? "..." : formatCurrency(finance.totalExpenses),
      subtitle: loading ? "" : `${formatCurrency(finance.expensesToday)} hoje`,
      icon: ArrowDownCircle,
      color: "text-red-600",
    },
    {
      title: "Lucro",
      value: loading ? "..." : formatCurrency(finance.profit),
      subtitle: loading ? "" : `${formatCurrency(finance.profitToday)} hoje`,
      icon: Scale,
      color: "text-blue-600",
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Financeiro</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fluxo de caixa integrado ao PDV, estoque e lançamentos manuais.
          </p>
        </div>

        <Link
          to="/financeiro"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver financeiro
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
            >
              <div className="flex items-center gap-2">
                <Icon size={18} className={item.color} />
                <span className="text-sm font-medium text-slate-600">
                  {item.title}
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">
                {item.value}
              </p>
              {item.subtitle && (
                <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
