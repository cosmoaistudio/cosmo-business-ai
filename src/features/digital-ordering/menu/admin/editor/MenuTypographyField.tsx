import { MENU_SAFE_FONTS, matchSafeFont } from "./menuEditor.types";

interface MenuTypographyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function MenuTypographyField({
  label,
  value,
  onChange,
}: MenuTypographyFieldProps) {
  const selected = matchSafeFont(value);

  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={selected}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        aria-label={label}
      >
        {MENU_SAFE_FONTS.map((font) => (
          <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
            {font.label}
          </option>
        ))}
      </select>
    </label>
  );
}
