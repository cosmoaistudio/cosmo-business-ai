import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { MenuTheme } from "../types/digitalMenu.types";
import { buttonStyleFor } from "../theme/menuTheme";
import MenuPreviewRegion from "../admin/editor/MenuPreviewRegion";

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
    <MenuPreviewRegion id="cartbar">
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur-xl sm:p-4"
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        borderColor: theme.borderColor,
        backgroundColor: theme.surfaceElevated,
        fontFamily: theme.fontFamily,
        boxShadow: "0 -8px 28px rgba(0,0,0,0.22)",
      }}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4 sm:max-w-xl md:max-w-3xl lg:max-w-5xl">
        <div className="min-w-0">
          <p className="text-xs font-medium sm:text-sm" style={{ color: theme.mutedTextColor }}>
            {itemCount} {itemCount === 1 ? "item" : "itens"} · quase lá
          </p>
          <p
            className="truncate text-xl font-bold tabular-nums sm:text-2xl"
            style={{ color: theme.textColor }}
          >
            {formatCurrency(total)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="digital-focus-ring digital-motion-press inline-flex min-h-12 shrink-0 items-center gap-2 px-5 py-3.5 text-sm font-semibold sm:min-h-14 sm:px-6 sm:text-base"
          style={buttonStyleFor(theme)}
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          {label || "Continuar"}
        </button>
      </div>
    </div>
    </MenuPreviewRegion>
  );
}
