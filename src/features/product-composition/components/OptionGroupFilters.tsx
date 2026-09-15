import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { OptionGroupStatusFilter } from "../types/optionGroup";

interface OptionGroupFiltersProps {
  search: string;
  status: OptionGroupStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OptionGroupStatusFilter) => void;
}

const STATUS_OPTIONS: Array<{ value: OptionGroupStatusFilter; label: string }> =
  [
    { value: "all", label: "Todos os status" },
    { value: "required", label: "Obrigatórios" },
    { value: "optional", label: "Opcionais" },
  ];

export default function OptionGroupFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: OptionGroupFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="flex flex-1 items-center gap-3">
        <Search className="shrink-0 text-slate-400" size={18} />

        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar grupos por nome ou descrição..."
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as OptionGroupStatusFilter)
        }
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
