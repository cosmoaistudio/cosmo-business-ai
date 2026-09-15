import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { OptionGroup } from "../types/optionGroup";
import type { OptionStatusFilter } from "../types/option";

interface OptionItemFiltersProps {
  search: string;
  status: OptionStatusFilter;
  groupId: string;
  groups: OptionGroup[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OptionStatusFilter) => void;
  onGroupChange: (value: string) => void;
}

const STATUS_OPTIONS: Array<{ value: OptionStatusFilter; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

export default function OptionItemFilters({
  search,
  status,
  groupId,
  groups,
  onSearchChange,
  onStatusChange,
  onGroupChange,
}: OptionItemFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
      <div className="flex flex-1 items-center gap-3">
        <Search className="shrink-0 text-slate-400" size={18} />

        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Pesquisar itens por nome ou descrição..."
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <select
        value={groupId}
        onChange={(event) => onGroupChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
      >
        <option value="">Todos os grupos</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as OptionStatusFilter)
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
