interface MenuToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export default function MenuToggleField({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: MenuToggleFieldProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition ${
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:border-slate-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          if (disabled) return;
          onChange(event.target.checked);
        }}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed"
        aria-label={label}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
