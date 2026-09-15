import AppModal from "@/components/shared/AppModal";
import { formatCurrency } from "@/lib/format";
import { useCustomerSales } from "../hooks/useCustomerSales";
import type { CustomerWithStats } from "../types/customer";
import { formatCpf, formatPhone } from "../utils/cpf";
import CustomerPurchaseHistory from "./CustomerPurchaseHistory";

interface CustomerDetailModalProps {
  customer: CustomerWithStats;
  onClose: () => void;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("pt-BR");
}

export default function CustomerDetailModal({
  customer,
  onClose,
}: CustomerDetailModalProps) {
  const { purchases, loading } = useCustomerSales(customer.id);

  return (
    <AppModal title={customer.name} onClose={onClose} size="xl">
      <p className="mb-6 -mt-1 text-sm text-slate-500">
        Detalhes do cliente e histórico de compras
      </p>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Total gasto</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">
            {formatCurrency(customer.totalSpent)}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Compras</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">
            {customer.purchaseCount}
          </p>
        </div>

        <div className="rounded-2xl bg-violet-50 p-4">
          <p className="text-sm text-violet-700">Última compra</p>
          <p className="mt-1 text-lg font-bold text-violet-900">
            {formatDate(customer.lastPurchaseAt)}
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Telefone</p>
          <p className="font-medium text-slate-900">
            {formatPhone(customer.phone)}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">CPF</p>
          <p className="font-medium text-slate-900">
            {formatCpf(customer.cpf)}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">E-mail</p>
          <p className="font-medium text-slate-900">
            {customer.email || "—"}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500">Data de nascimento</p>
          <p className="font-medium text-slate-900">
            {formatDate(customer.birth_date)}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-slate-500">Endereço</p>
          <p className="font-medium text-slate-900">
            {customer.address || "—"}
          </p>
        </div>

        {customer.notes && (
          <div className="md:col-span-2">
            <p className="text-sm text-slate-500">Observações</p>
            <p className="font-medium text-slate-900">{customer.notes}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Histórico de compras
        </h3>

        <CustomerPurchaseHistory purchases={purchases} loading={loading} />
      </div>
    </AppModal>
  );
}
