import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MenuTheme } from "../types/digitalMenu.types";
import { buttonStyleFor } from "../theme/menuTheme";

interface MenuCartBarProps {
  itemCount: number;
  total: number;
  label: string;
  theme: MenuTheme;
  onOpenCart: () => void;
}

/** Fixed cart access bar. Hidden while the cart is empty. */
export default function MenuCartBar({
  itemCount,
  total,
  label,
  theme,
  onOpenCart,
}: MenuCartBarProps) {
  if (itemCount <= 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-xl"
      style={{
        // Respects the iOS home indicator area.
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        borderColor: theme.borderColor,
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm" style={{ color: theme.mutedTextColor }}>
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </p>
          <p
            className="truncate text-xl font-bold"
            style={{ color: theme.textColor }}
          >
            {formatCurrency(total)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="inline-flex shrink-0 items-center gap-2 px-6 py-4 font-semibold transition active:scale-[0.98]"
          style={buttonStyleFor(theme)}
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {label}
        </button>
      </div>
    </div>
  );
}
