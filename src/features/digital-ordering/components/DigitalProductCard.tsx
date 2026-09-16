import { ImageIcon, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  radiusToCss,
} from "../menu/theme/menuTheme";
import { resolveProductPrice } from "../menu/core/menuCatalog";

export type DigitalProductCardVariant = "grid" | "list" | "highlight";

interface DigitalProductCardProps {
  product: DigitalMenuProduct;
  onSelect: () => void;
  theme?: MenuTheme;
  variant?: DigitalProductCardVariant;
  showDescription?: boolean;
  showImage?: boolean;
  addLabel?: string;
  customizableLabel?: string;
}

function ProductImage({
  product,
  theme,
  className,
}: {
  product: DigitalMenuProduct;
  theme: MenuTheme;
  className: string;
}) {
  if (!product.imageUrl) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: theme.borderColor }}
        aria-hidden="true"
      >
        <ImageIcon className="h-6 w-6" style={{ color: theme.mutedTextColor }} />
      </div>
    );
  }

  return (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}

export default function DigitalProductCard({
  product,
  onSelect,
  theme = DEFAULT_MENU_THEME,
  variant = "grid",
  showDescription = true,
  showImage = true,
  addLabel = "Adicionar",
  customizableLabel = "Personalizável",
}: DigitalProductCardProps) {
  const price = resolveProductPrice(product);
  const isCombo =
    product.menuKind === "combo" || (product.comboSlots?.length ?? 0) > 0;
  const slotCount = product.comboSlots?.length ?? 0;
  const groupCount = product.groups.length;
  const withImage = showImage && theme.showProductImages;

  const badge = isCombo
    ? `Combo · ${slotCount} componente${slotCount === 1 ? "" : "s"}`
    : groupCount > 0
      ? `${customizableLabel} · ${groupCount} grupo${groupCount > 1 ? "s" : ""}`
      : null;

  const cardStyle = {
    backgroundColor: theme.surfaceColor,
    borderColor: theme.borderColor,
    color: theme.textColor,
    borderRadius: radiusToCss(theme.cardRadius),
  } as const;

  const priceBlock = (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-lg font-bold" style={{ color: theme.textColor }}>
        {formatCurrency(price.effectivePrice)}
      </span>
      {price.hasPromotion && (
        <span
          className="text-sm line-through"
          style={{ color: theme.mutedTextColor }}
        >
          {formatCurrency(price.basePrice)}
        </span>
      )}
    </div>
  );

  const promotionTag = price.hasPromotion ? (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: theme.accentColor, color: "#0f172a" }}
    >
      -{price.discountPercent}%
    </span>
  ) : null;

  if (variant === "list") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full items-center gap-4 border p-3 text-left transition active:scale-[0.99] hover:opacity-95"
        style={cardStyle}
      >
        {withImage && (
          <ProductImage
            product={product}
            theme={theme}
            className="h-20 w-20 shrink-0 rounded-xl"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate font-semibold">{product.name}</h3>
            {promotionTag}
          </div>
          {showDescription && product.description && (
            <p
              className="mt-0.5 line-clamp-2 text-sm"
              style={{ color: theme.mutedTextColor }}
            >
              {product.description}
            </p>
          )}
          <div className="mt-1.5">{priceBlock}</div>
        </div>

        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={buttonStyleFor(theme)}
          aria-hidden="true"
        >
          <Plus className="h-5 w-5" />
        </span>
      </button>
    );
  }

  const isHighlight = variant === "highlight";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col overflow-hidden border text-left transition active:scale-[0.99] hover:opacity-95 ${
        isHighlight ? "w-[240px] shrink-0" : "w-full"
      }`}
      style={cardStyle}
    >
      {withImage && (
        <div className="relative">
          <ProductImage
            product={product}
            theme={theme}
            className={isHighlight ? "h-32 w-full" : "h-40 w-full"}
          />
          {promotionTag && <div className="absolute left-3 top-3">{promotionTag}</div>}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-tight">{product.name}</h3>

        {badge && (
          <p className="text-xs" style={{ color: theme.mutedTextColor }}>
            {badge}
          </p>
        )}

        {showDescription && product.description && !isHighlight && (
          <p
            className="line-clamp-2 text-sm"
            style={{ color: theme.mutedTextColor }}
          >
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {priceBlock}
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
            style={buttonStyleFor(theme)}
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
