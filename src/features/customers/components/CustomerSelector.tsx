import { useMemo } from "react";
import { Search, UserRound, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCustomerSearch } from "../hooks/useCustomerSearch";
import type { Customer } from "../types/customer";
import { formatCpf, formatPhone } from "../utils/cpf";

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
}

export default function CustomerSelector({
  value,
  onChange,
}: CustomerSelectorProps) {
  const { customers, loading, search, setSearch } = useCustomerSearch();

  const filteredCustomers = useMemo(() => {
    if (!value) return customers;
    return customers.filter((customer) => customer.id !== value.id);
  }, [customers, value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Cliente (opcional)</p>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <X size={14} />
            Remover
          </button>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <UserRound size={18} />
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{value.name}</p>
            <p className="truncate text-sm text-slate-500">
              {formatPhone(value.phone)} · {formatCpf(value.cpf)}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente por nome, telefone ou CPF..."
              className="rounded-xl pl-9"
            />
          </div>

          <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2">
            {loading && (
              <p className="px-3 py-2 text-sm text-slate-500">
                Buscando clientes...
              </p>
            )}

            {!loading && filteredCustomers.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">
                Nenhum cliente encontrado.
              </p>
            )}

            {!loading &&
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    onChange(customer);
                    setSearch("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {formatPhone(customer.phone)} · {formatCpf(customer.cpf)}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
