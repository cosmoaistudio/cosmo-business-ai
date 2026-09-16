import { Search, X } from "lucide-react";
import type { MenuTheme } from "../types/digitalMenu.types";
import { radiusToCss } from "../theme/menuTheme";

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
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full border pl-11 pr-11 text-base outline-none transition placeholder:opacity-60 focus:ring-2"
        style={{
          backgroundColor: theme.surfaceColor,
          borderColor: theme.borderColor,
          color: theme.textColor,
          borderRadius: radiusToCss(theme.buttonRadius),
        }}
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ backgroundColor: theme.borderColor, color: theme.textColor }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
