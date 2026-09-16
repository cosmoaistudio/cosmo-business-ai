import { listNiches } from "../config/nicheConfig";
import type { DigitalMenuNiche } from "../types/digitalMenu.types";

interface MenuNicheSelectorProps {
  value: DigitalMenuNiche;
  onChange: (niche: DigitalMenuNiche) => void;
}

/**
 * Niche is a store-level setting persisted in the existing digital_stores
 * settings jsonb. Options come from the registry, never from a hardcoded list.
 */
export default function MenuNicheSelector({
  value,
  onChange,
}: MenuNicheSelectorProps) {
  const niches = listNiches();

  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-700">
        Nicho do cardápio
      </legend>
      <p className="mb-3 text-xs text-slate-500">
        Define textos, ordem sugerida de categorias e aparência padrão. Não altera
        seus produtos nem seus preços.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {niches.map((entry) => {
          const active = entry.niche === value;

          return (
            <label
              key={entry.niche}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                active
                  ? "border-blue-500 bg-blue-50 font-medium text-blue-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="digital-menu-niche"
                value={entry.niche}
                checked={active}
                onChange={() => onChange(entry.niche)}
                className="h-4 w-4"
              />
              {entry.niche === "generic" ? "Outros" : entry.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
