import { contrastWarning } from "../../theme/contrastHint";

interface MenuColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  contrastAgainst?: string;
}

function normalizeHex(raw: string): string {
  const trimmed = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

/**
 * Accessible color field: native picker + hex text input.
 */
export default function MenuColorField({
  label,
  value,
  onChange,
  hint,
  contrastAgainst,
}: MenuColorFieldProps) {
  const pickerValue = value.startsWith("#") && value.length === 7 ? value : "#ffffff";
  const warning = contrastAgainst ? contrastWarning(value, contrastAgainst) : null;

  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(event) => onChange(normalizeHex(event.target.value))}
          spellCheck={false}
          autoComplete="off"
          inputMode="text"
          aria-label={`${label} (hexadecimal)`}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          placeholder="#000000"
        />
      </div>
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
      {warning ? (
        <span className="block text-xs text-amber-700" role="status">
          {warning}
        </span>
      ) : null}
    </label>
  );
}
