import type { ProductMenuFilter } from "../utils/productMenuKind";

const FILTERS: Array<{ id: ProductMenuFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "simple", label: "Simples" },
  { id: "assembled", label: "Copos montados" },
  { id: "combo", label: "Combos" },
  { id: "paused", label: "Pausados" },
];

export default function ProductMenuFilters({
  value,
  onChange,
}: {
  value: ProductMenuFilter;
  onChange: (value: ProductMenuFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const active = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              active
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
