import { Search, X } from "lucide-react";
import type { MenuTheme } from "../types/digitalMenu.types";
import { radiusToCss, shadowFor } from "../theme/menuTheme";

interface MenuSearchProps {
  value: string;
  placeholder: string;
  theme: MenuTheme;
  onChange: (value: string) => void;
}

export default function MenuSearch({
  value,
  placeholder,
  theme,
  onChange,
}: MenuSearchProps) {
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: theme.mutedTextColor }}
        aria-hidden="true"
      />

      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || "Buscar no cardápio"}
        aria-label={placeholder || "Buscar no cardápio"}
        className="digital-focus-ring h-12 w-full border pl-11 pr-11 text-base outline-none transition-[box-shadow,border-color,background-color] duration-200 placeholder:opacity-60 focus:h-[3.25rem]"
        style={{
          backgroundColor: hasValue ? theme.surfaceElevated : theme.surfaceColor,
          borderColor: hasValue ? theme.primaryColor : theme.borderColor,
          color: theme.textColor,
          borderRadius: radiusToCss(theme.buttonRadius),
          boxShadow: hasValue ? shadowFor(theme) : "none",
          fontFamily: theme.fontFamily,
        }}
      />

      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="digital-focus-ring digital-motion-press absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center"
          style={{
            backgroundColor: theme.borderColor,
            color: theme.textColor,
            borderRadius: "9999px",
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
