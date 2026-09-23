interface MenuLayoutOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface MenuLayoutFieldProps<T extends string> {
  label: string;
  value: T;
  options: Array<MenuLayoutOption<T>>;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}

/**
 * Segmented visual choice — replaces dense selects for layout tokens.
 */
export default function MenuLayoutField<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: MenuLayoutFieldProps<T>) {
  const grid =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className={`grid gap-2 ${grid}`} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const active = option.value === value;
          return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-label={option.label}
                aria-checked={active}
                onClick={() => onChange(option.value)}
              className={`rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              {option.description ? (
                <span
                  className={`mt-0.5 block text-[11px] leading-snug ${
                    active ? "text-white/70" : "text-slate-500"
                  }`}
                >
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
