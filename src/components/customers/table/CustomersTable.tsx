import { Eye, Pencil, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import { formatCurrency } from "@/lib/format";
import {
  formatCpf,
  formatPhone,
  type CustomerWithStats,
} from "@/features/customers";
import Pagination from "../Pagination";

interface CustomersTableProps {
  customers: CustomerWithStats[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onView: (customer: CustomerWithStats) => void;
  onEdit: (customer: CustomerWithStats) => void;
  onDelete: (customer: CustomerWithStats) => void;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("pt-BR");
}

export default function CustomersTable({
  customers,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <TableLoadingState label="Carregando clientes" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Cadastre clientes ou ajuste os filtros de busca."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-6 py-4 text-left">Cliente</th>
            <th className="text-left">Telefone</th>
            <th className="text-left">CPF</th>
            <th className="text-left">Compras</th>
            <th className="text-left">Total gasto</th>
            <th className="text-left">Última compra</th>
            <th className="pr-6 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {customers.length === 0 && (
            <tr>
              <td colSpan={7} className="p-10 text-center text-slate-500">
                Nenhum cliente encontrado.
              </td>
            </tr>
          )}

          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b transition hover:bg-slate-50"
            >
              <td className="px-6 py-5">
                <div>
                  <p className="font-semibold text-slate-900">
                    {customer.name}
                  </p>
                  {customer.email && (
                    <p className="text-sm text-slate-500">{customer.email}</p>
                  )}
                </div>
              </td>

              <td>{formatPhone(customer.phone)}</td>
              <td>{formatCpf(customer.cpf)}</td>
              <td>{customer.purchaseCount}</td>
              <td>{formatCurrency(customer.totalSpent)}</td>
              <td>{formatDate(customer.lastPurchaseAt)}</td>

              <td>
                <div className="flex justify-end gap-2 pr-6">
                  <button
                    type="button"
                    onClick={() => onView(customer)}
                    className="rounded-xl p-2 hover:bg-slate-100"
                    aria-label={`Ver ${customer.name}`}
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="rounded-xl p-2 hover:bg-slate-100"
                    aria-label={`Editar ${customer.name}`}
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(customer)}
                    className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Excluir ${customer.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
