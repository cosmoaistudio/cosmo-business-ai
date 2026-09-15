import type { KitchenFilterKey } from "../types/kitchenDisplay.types";
import { KITCHEN_FILTER_LABELS } from "../types/kitchenDisplay.types";

interface KitchenFiltersProps {
  value: KitchenFilterKey;
  onChange: (value: KitchenFilterKey) => void;
}

const FILTERS: KitchenFilterKey[] = [
  "all",
  "delivery",
  "pickup",
  "dine_in",
  "counter",
];

export default function KitchenFilters({ value, onChange }: KitchenFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`min-h-12 rounded-full px-5 text-sm font-bold transition ${
            value === filter
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {KITCHEN_FILTER_LABELS[filter]}
        </button>
      ))}
    </div>
  );
}
