import { PackageOpen, RefreshCw } from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import DigitalProductCard from "./DigitalProductCard";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  radiusToCss,
} from "../menu/theme/menuTheme";
import MenuPreviewRegion from "../menu/admin/editor/MenuPreviewRegion";

interface DigitalMenuGridProps {
  products: DigitalMenuProduct[];
  loading: boolean;
  onSelectProduct: (productId: string) => void;
  theme?: MenuTheme;
  emptyMessage?: string;
  showDescriptions?: boolean;
  showImages?: boolean;
  showPopularBadge?: boolean;
  showPromotions?: boolean;
  cardEmphasis?: "balanced" | "price" | "image" | "service";
  addLabel?: string;
  customizableLabel?: string;
  onRetry?: () => void;
}

function ProductSkeleton({
  theme,
  list,
}: {
  theme: MenuTheme;
  list: boolean;
}) {
  if (list) {
    return (
      <div
        className="flex items-center gap-3 border p-3"
        style={{
          borderColor: theme.borderColor,
          borderRadius: radiusToCss(theme.cardRadius),
          backgroundColor: theme.surfaceColor,
        }}
        aria-hidden
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div
            className="digital-skeleton h-4 w-2/3 animate-pulse rounded"
            style={{ backgroundColor: theme.borderColor }}
          />
          <div
            className="digital-skeleton h-3 w-full animate-pulse rounded"
            style={{ backgroundColor: theme.borderColor }}
          />
          <div
            className="digital-skeleton h-4 w-1/4 animate-pulse rounded"
            style={{ backgroundColor: theme.borderColor }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden border"
      style={{
        borderColor: theme.borderColor,
        borderRadius: radiusToCss(theme.cardRadius),
        backgroundColor: theme.surfaceColor,
      }}
      aria-hidden
    >
      <div
        className="digital-skeleton h-36 animate-pulse"
        style={{ backgroundColor: theme.borderColor }}
      />
      <div className="space-y-2 p-3.5">
        <div
          className="digital-skeleton h-4 w-3/4 animate-pulse rounded"
          style={{ backgroundColor: theme.borderColor }}
        />
        <div
          className="digital-skeleton h-3 w-1/2 animate-pulse rounded"
          style={{ backgroundColor: theme.borderColor }}
        />
        <div
          className="digital-skeleton mt-3 h-5 w-1/3 animate-pulse rounded"
          style={{ backgroundColor: theme.borderColor }}
        />
      </div>
    </div>
  );
}

export default function DigitalMenuGrid({
  products,
  loading,
  onSelectProduct,
  theme = DEFAULT_MENU_THEME,
  emptyMessage = "Nenhum produto disponível no momento.",
  showDescriptions = true,
  showImages = true,
  showPopularBadge = false,
  showPromotions = true,
  cardEmphasis = "balanced",
  addLabel,
  customizableLabel,
  onRetry,
}: DigitalMenuGridProps) {
  const isList = theme.productLayout === "list";

  if (loading) {
    return (
      <div
        className={
          isList
            ? "grid grid-cols-1 gap-2"
            : "grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3"
        }
        role="status"
        aria-busy="true"
        aria-label="Carregando produtos"
        data-catalog-layout={isList ? "list" : "grid"}
      >
        {Array.from({ length: isList ? 4 : 6 }).map((_, index) => (
          <ProductSkeleton key={index} theme={theme} list={isList} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center"
        style={{
          borderColor: theme.borderColor,
          color: theme.mutedTextColor,
          borderRadius: radiusToCss(theme.cardRadius),
          backgroundColor: theme.surfaceMuted,
        }}
      >
        <PackageOpen
          className="h-8 w-8"
          style={{ color: theme.mutedTextColor }}
          aria-hidden
        />
        <p className="max-w-sm text-sm">{emptyMessage}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="digital-focus-ring digital-motion-press mt-1 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            style={buttonStyleFor(theme)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Tentar novamente
          </button>
        ) : null}
      </div>
    );
  }

  const gap =
    theme.density === "compact"
      ? "gap-2"
      : theme.density === "spacious"
        ? "gap-4 sm:gap-5"
        : "gap-3 sm:gap-4";

  const columnsClass =
    theme.catalogColumns === 4
      ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : theme.catalogColumns === 3
        ? "grid-cols-2 xl:grid-cols-3"
        : "grid-cols-2";

  return (
    <div
      className={isList ? `grid grid-cols-1 ${gap}` : `grid ${gap} ${columnsClass}`}
      data-catalog-layout={isList ? "list" : "grid"}
    >
      {products.map((product) => (
        <MenuPreviewRegion key={product.id} id="card">
          <DigitalProductCard
            product={product}
            theme={theme}
            variant={isList ? "list" : "grid"}
            showDescription={showDescriptions}
            showImage={showImages}
            showPopularBadge={showPopularBadge}
            showPromotions={showPromotions}
            cardEmphasis={cardEmphasis}
            addLabel={addLabel}
            customizableLabel={customizableLabel}
            onSelect={() => onSelectProduct(product.id)}
          />
        </MenuPreviewRegion>
      ))}
    </div>
  );
}
