import { Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import { Button } from "@/components/ui/button";
import Card from "@/components/shared/Card";
import { formatCurrency } from "@/lib/format";
import type { FinancialTransaction } from "../types/finance";
import {
  getCategoryLabel,
  TRANSACTION_SOURCE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "../types/finance";

interface TransactionsTableProps {
  transactions: FinancialTransaction[];
  loading?: boolean;
  onDelete?: (transaction: FinancialTransaction) => void;
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function TransactionsTable({
  transactions,
  loading = false,
  onDelete,
}: TransactionsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Lançamentos financeiros
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Entradas manuais, despesas e vendas integradas do PDV.
        </p>
      </div>

      {loading && <TableLoadingState label="Carregando lançamentos" />}

      {!loading && transactions.length === 0 && (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description="Nenhum lançamento encontrado no período selecionado."
        />
      )}

      {!loading && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Origem</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t border-slate-100 hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        transaction.type === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {TRANSACTION_TYPE_LABELS[transaction.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {getCategoryLabel(transaction.category)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {transaction.customer_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {TRANSACTION_SOURCE_LABELS[transaction.source]}
                  </td>
                  <td
                    className={`px-6 py-4 font-bold ${
                      transaction.type === "income"
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </td>
                  <td className="px-6 py-4">
                    {transaction.source === "manual" && onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDelete(transaction)}
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Remover lançamento"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
