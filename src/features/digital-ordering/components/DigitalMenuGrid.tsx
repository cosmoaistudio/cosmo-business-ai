import { Loader2 } from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import DigitalProductCard from "./DigitalProductCard";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import { DEFAULT_MENU_THEME, radiusToCss } from "../menu/theme/menuTheme";

interface DigitalMenuGridProps {
  products: DigitalMenuProduct[];
  loading: boolean;
  onSelectProduct: (productId: string) => void;
  theme?: MenuTheme;
  emptyMessage?: string;
  showDescriptions?: boolean;
  addLabel?: string;
  customizableLabel?: string;
}

export default function DigitalMenuGrid({
  products,
  loading,
  onSelectProduct,
  theme = DEFAULT_MENU_THEME,
  emptyMessage = "Nenhum produto disponível no momento.",
  showDescriptions = true,
  addLabel,
  customizableLabel,
}: DigitalMenuGridProps) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: theme.mutedTextColor }}
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className="border border-dashed p-10 text-center"
        style={{
          borderColor: theme.borderColor,
          color: theme.mutedTextColor,
          borderRadius: radiusToCss(theme.cardRadius),
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const isList = theme.productLayout === "list";
  const gap = theme.density === "compact" ? "gap-2" : "gap-4";

  return (
    <div
      className={
        isList
          ? `grid ${gap} lg:grid-cols-2`
          : `grid ${gap} grid-cols-2 lg:grid-cols-3`
      }
    >
      {products.map((product) => (
        <DigitalProductCard
          key={product.id}
          product={product}
          theme={theme}
          variant={isList ? "list" : "grid"}
          showDescription={showDescriptions}
          addLabel={addLabel}
          customizableLabel={customizableLabel}
          onSelect={() => onSelectProduct(product.id)}
        />
      ))}
    </div>
  );
}
