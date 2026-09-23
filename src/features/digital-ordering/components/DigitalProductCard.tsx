import { useState } from "react";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  radiusToCss,
  shadowFor,
} from "../menu/theme/menuTheme";
import {
  resolveCtaPlacement,
  resolvePricePlacement,
} from "../menu/theme/cardPlacement";
import { resolveProductPrice } from "../menu/core/menuCatalog";
import { formatProductPriceLabel } from "../menu/core/fromPriceLabel";

export type DigitalProductCardVariant = "grid" | "list" | "highlight";

interface DigitalProductCardProps {
  product: DigitalMenuProduct;
  onSelect: () => void;
  theme?: MenuTheme;
  variant?: DigitalProductCardVariant;
  showDescription?: boolean;
  showImage?: boolean;
  showPopularBadge?: boolean;
  showPromotions?: boolean;
  cardEmphasis?: "balanced" | "price" | "image" | "service";
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
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const aspectClass =
    theme.imageAspect === "portrait"
      ? "aspect-[3/4]"
      : theme.imageAspect === "landscape"
        ? "aspect-[4/3]"
        : "aspect-square";

  if (!product.imageUrl || failed) return null;

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${className}`}
      style={{ backgroundColor: theme.surfaceMuted }}
      data-product-image=""
    >
      {!loaded ? (
        <div
          className="digital-skeleton absolute inset-0 animate-pulse"
          style={{ backgroundColor: theme.borderColor }}
          aria-hidden
        />
      ) : null}
      <img
        src={product.imageUrl}
        alt={product.name}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function listImageClass(theme: MenuTheme): string {
  if (theme.density === "compact" || theme.imageSize === "compact") {
    return "h-14 w-14";
  }
  if (theme.density === "spacious" || theme.imageSize === "large") {
    return "h-20 w-20";
  }
  return "h-16 w-16";
}

export default function DigitalProductCard({
  product,
  onSelect,
  theme = DEFAULT_MENU_THEME,
  variant = "grid",
  showDescription = true,
  showImage = true,
  showPopularBadge = false,
  showPromotions = true,
  cardEmphasis = "balanced",
  addLabel = "Adicionar",
  customizableLabel = "Personalizável",
}: DigitalProductCardProps) {
  const price = resolveProductPrice(product);
  const isCombo =
    product.menuKind === "combo" || (product.comboSlots?.length ?? 0) > 0;
  const slotCount = product.comboSlots?.length ?? 0;
  const groupCount = product.groups.length;
  const canShowImage =
    showImage && theme.showProductImages && cardEmphasis !== "service";
  const renderImage = canShowImage && Boolean(product.imageUrl);
  const compact = theme.density === "compact";
  const spacious = theme.density === "spacious";
  const pricePlace = resolvePricePlacement(theme.pricePosition);
  const ctaPlace = resolveCtaPlacement(theme.ctaPosition);
  const popular =
    showPopularBadge && Boolean((product as { featured?: boolean }).featured);
  const priceLabel = formatProductPriceLabel(product, price.effectivePrice);

  const badge = isCombo
    ? `Combo · ${slotCount} componente${slotCount === 1 ? "" : "s"}`
    : groupCount > 0
      ? `${customizableLabel} · ${groupCount} grupo${groupCount > 1 ? "s" : ""}`
      : cardEmphasis === "service"
        ? customizableLabel
        : null;

  const cardStyle = {
    backgroundColor:
      theme.cardStyle === "flat" ? theme.surfaceMuted : theme.surfaceColor,
    borderColor: theme.borderColor,
    color: theme.textColor,
    borderRadius: radiusToCss(theme.cardRadius),
    boxShadow:
      theme.cardStyle === "elevated" && theme.shadowStyle !== "none"
        ? shadowFor(theme)
        : "none",
    borderWidth: theme.cardStyle === "flat" ? 0 : 1,
    borderStyle: "solid",
  } as const;

  const priceBlock = (
    <div
      className="flex flex-wrap items-baseline gap-1.5"
      data-price-label={priceLabel}
    >
      <span
        className={`font-bold tabular-nums ${
          cardEmphasis === "price" || variant === "list"
            ? "text-base sm:text-lg"
            : "text-base sm:text-lg"
        }`}
        style={{ color: theme.primaryColor }}
      >
        {priceLabel}
      </span>
      {showPromotions && price.hasPromotion && (
        <span
          className="text-xs line-through tabular-nums"
          style={{ color: theme.mutedTextColor }}
        >
          {formatCurrency(price.basePrice)}
        </span>
      )}
    </div>
  );

  const promotionTag =
    showPromotions && price.hasPromotion ? (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
        style={{
          backgroundColor: theme.accentColor,
          color: theme.backgroundColor,
        }}
      >
        -{price.discountPercent}%
      </span>
    ) : null;

  const popularTag = popular ? (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{
        backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`,
        color: theme.textColor,
      }}
    >
      Popular
    </span>
  ) : null;

  if (variant === "list") {
    const showListCta = cardEmphasis === "service" || spacious;
    const rowPad = compact ? "p-2.5" : spacious ? "p-3.5 sm:p-4" : "p-3";

    return (
      <button
        type="button"
        onClick={onSelect}
        className={`digital-focus-ring digital-motion-press group flex w-full min-w-0 items-center gap-3 border text-left ${rowPad}`}
        style={cardStyle}
        aria-label={`${product.name}, ${priceLabel}`}
        data-card-variant="list"
        data-has-image={renderImage ? "true" : "false"}
      >
        <div className="min-w-0 flex-1">
          {pricePlace === "top" ? <div className="mb-1">{priceBlock}</div> : null}
          <div className="flex items-start gap-2">
            <h3
              className="min-w-0 flex-1 font-semibold leading-snug"
              style={{ fontFamily: theme.headingFontFamily }}
            >
              {product.name}
            </h3>
            {pricePlace === "inline" ? (
              <div className="shrink-0 text-right">{priceBlock}</div>
            ) : null}
            {popularTag}
            {promotionTag}
          </div>
          {badge ? (
            <p className="mt-0.5 text-[11px]" style={{ color: theme.mutedTextColor }}>
              {badge}
            </p>
          ) : null}
          {showDescription && product.description ? (
            <p
              className="mt-0.5 line-clamp-2 text-sm"
              style={{ color: theme.mutedTextColor }}
              data-product-description=""
            >
              {product.description}
            </p>
          ) : null}
          {pricePlace === "bottom" ? <div className="mt-1.5">{priceBlock}</div> : null}
        </div>

        {renderImage ? (
          <div
            className="shrink-0 overflow-hidden"
            style={{ borderRadius: radiusToCss(theme.cardRadius) }}
          >
            <ProductImage
              product={product}
              theme={theme}
              className={listImageClass(theme)}
            />
          </div>
        ) : null}

        {showListCta ? (
          <span
            className={`flex shrink-0 items-center justify-center ${
              ctaPlace === "full" && cardEmphasis === "service"
                ? "min-h-11 px-3"
                : "h-9 w-9"
            }`}
            style={buttonStyleFor(theme)}
            aria-hidden="true"
          >
            {ctaPlace === "full" && cardEmphasis === "service" ? (
              <span className="text-xs font-semibold">{addLabel}</span>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </span>
        ) : null}
      </button>
    );
  }

  const isHighlight = variant === "highlight";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`digital-focus-ring digital-motion-press group flex flex-col overflow-hidden border text-left ${
        isHighlight ? "w-[220px] shrink-0 sm:w-[240px]" : "w-full"
      }`}
      style={cardStyle}
      aria-label={`${product.name}, ${priceLabel}`}
      data-card-variant={isHighlight ? "highlight" : "grid"}
      data-has-image={renderImage ? "true" : "false"}
    >
      {renderImage ? (
        <div className="relative">
          <ProductImage
            product={product}
            theme={theme}
            className={
              isHighlight
                ? "h-28 w-full sm:h-32"
                : theme.imageSize === "compact" || compact
                  ? "h-28 w-full"
                  : theme.imageSize === "large" || spacious
                    ? "h-44 w-full sm:h-48"
                    : "h-36 w-full sm:h-40"
            }
          />
          {promotionTag && (
            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
              {popularTag}
              {promotionTag}
            </div>
          )}
          {!promotionTag && popularTag ? (
            <div className="absolute left-2.5 top-2.5">{popularTag}</div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`flex flex-1 flex-col ${
          compact ? "gap-1 p-3" : spacious ? "gap-2 p-4 sm:p-5" : "gap-1.5 p-3.5 sm:p-4"
        }`}
      >
        {pricePlace === "top" ? priceBlock : null}

        <div className="flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2 min-w-0 flex-1 font-semibold leading-snug"
            style={{ fontFamily: theme.headingFontFamily }}
          >
            {product.name}
          </h3>
          {pricePlace === "inline" ? priceBlock : null}
        </div>

        {badge && (
          <p className="text-[11px]" style={{ color: theme.mutedTextColor }}>
            {badge}
          </p>
        )}

        {showDescription && product.description && !isHighlight && (
          <p
            className="line-clamp-2 text-xs sm:text-sm"
            style={{ color: theme.mutedTextColor }}
            data-product-description=""
          >
            {product.description}
          </p>
        )}

        <div
          className={`mt-auto flex gap-2 pt-2 ${
            ctaPlace === "full"
              ? "flex-col"
              : "items-end justify-between"
          }`}
        >
          {pricePlace === "bottom" ? priceBlock : null}
          <span
            className={`inline-flex min-h-9 items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${
              ctaPlace === "full" ? "w-full" : ""
            }`}
            style={buttonStyleFor(theme)}
          >
            {cardEmphasis === "service" ? null : (
              <Plus className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className={cardEmphasis === "service" || ctaPlace === "full" ? "" : "hidden sm:inline"}>
              {addLabel}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
