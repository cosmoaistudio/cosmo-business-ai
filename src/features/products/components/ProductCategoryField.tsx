import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import {
  filterCategorySuggestions,
  isNewCategoryValue,
} from "../utils/productCategories";

interface ProductCategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  disabled?: boolean;
  placeholder?: string;
  name?: string;
}

export default function ProductCategoryField({
  value,
  onChange,
  suggestions,
  disabled = false,
  placeholder = "Categoria (ex.: Açaí, Bebidas, Combos)",
  name = "category",
}: ProductCategoryFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => filterCategorySuggestions(suggestions, value),
    [suggestions, value]
  );
  const canCreateHint = isNewCategoryValue(suggestions, value);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium text-slate-500">
        Categoria
      </label>
      <input
        name={name}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        className="cosmo-input w-full p-3"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      />

      {open && !disabled && (filtered.length > 0 || canCreateHint) ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.map((category) => (
            <li key={category}>
              <button
                type="button"
                role="option"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(category);
                  setOpen(false);
                }}
              >
                <Check
                  size={14}
                  className={
                    category.toLocaleLowerCase("pt-BR") ===
                    value.trim().toLocaleLowerCase("pt-BR")
                      ? "text-blue-600"
                      : "text-transparent"
                  }
                />
                {category}
              </button>
            </li>
          ))}

          {canCreateHint ? (
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(value.trim());
                  setOpen(false);
                }}
              >
                <Plus size={14} />
                Usar &quot;{value.trim()}&quot; como nova categoria
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <p className="mt-1 text-xs text-slate-400">
        Digite uma categoria existente ou crie uma nova ao salvar o produto.
      </p>
    </div>
  );
}
