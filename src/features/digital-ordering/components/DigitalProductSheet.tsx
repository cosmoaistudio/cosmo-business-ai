import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppSheet from "@/components/shared/AppSheet";
import { ProductComposerView, useProductComposer } from "@/features/product-engine";
import { getProductById } from "@/features/products/repository/products.repository";
import type { Product } from "@/features/products/types/product";
import type { ComposerConfirmResult } from "@/features/product-engine/integrations/cart.adapter";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import { resolveDigitalMenuBasePrice } from "@/features/products/utils/productDigitalPromo";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  radiusToCss,
  sheetPanelStyle,
} from "../menu/theme/menuTheme";
import { composerInputFromDigitalMenuProduct } from "../utils/digitalMenuComposerBridge";
import MenuPreviewRegion from "../menu/admin/editor/MenuPreviewRegion";

interface DigitalProductSheetProps {
  productId: string | null;
  /** Snapshot item from the public catalog — preferred for anon /menu/:slug. */
  menuProduct?: DigitalMenuProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (result: ComposerConfirmResult) => void;
  theme?: MenuTheme;
}

/**
 * Image and description live here rather than inside ProductComposerView,
 * which is shared with the PDV and must keep its current layout.
 */
function ProductHero({
  product,
  theme,
  displayPrice,
  promotionalPrice,
}: {
  product: Product;
  theme: MenuTheme;
  displayPrice: number;
  promotionalPrice: number | null;
}) {
  const imageUrl = product.image_url ?? product.image ?? null;
  const description = product.description?.trim();
  const hasPromo =
    promotionalPrice != null &&
    Number.isFinite(promotionalPrice) &&
    promotionalPrice < displayPrice;

  return (
    <div className="mb-5 space-y-3 digital-sheet-enter">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-48 w-full object-cover sm:h-56"
          style={{
            borderRadius: radiusToCss(theme.cardRadius),
            boxShadow: `var(--digital-shadow, none)`,
          }}
        />
      ) : null}

      <h2
        className="text-xl font-bold tracking-tight sm:text-2xl"
        style={{
          fontFamily: theme.headingFontFamily,
          color: theme.textColor,
        }}
      >
        {product.name}
      </h2>

      {description ? (
        <p
          className="text-sm leading-relaxed"
          style={{ color: theme.mutedTextColor }}
        >
          {description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline gap-2">
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: theme.primaryColor }}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(hasPromo ? promotionalPrice! : displayPrice)}
        </p>
        {hasPromo ? (
          <>
            <p
              className="text-sm line-through tabular-nums"
              style={{ color: theme.mutedTextColor }}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(displayPrice)}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: theme.accentColor,
                color: "#fff",
              }}
            >
              Promoção
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function DigitalProductSheet({
  productId,
  menuProduct = null,
  open,
  onClose,
  onAddToCart,
  theme = DEFAULT_MENU_THEME,
}: DigitalProductSheetProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [preloadedNode, setPreloadedNode] = useState<EngineProductNode | null>(
    null
  );
  const [loadingProduct, setLoadingProduct] = useState(false);

  const composer = useProductComposer(product, null, {
    preloadedNode,
  });

  const digitalBase = product
    ? resolveDigitalMenuBasePrice(Number(product.price), product.promotionalPrice)
    : 0;
  const paidAddons =
    (composer.pricing?.addonsTotal ?? 0) + (composer.pricing?.premiumTotal ?? 0);
  const digitalUnitPrice = digitalBase + paidAddons;
  const digitalLineTotal = digitalUnitPrice * composer.quantity;

  useEffect(() => {
    if (!open || !productId) {
      setProduct(null);
      setPreloadedNode(null);
      return;
    }

    // Prefer the published snapshot so anon customers never hit RLS-protected
    // product tables. Fall back to authenticated getProductById only when the
    // snapshot entry is missing (e.g. staff preview with a live catalog).
    if (menuProduct && menuProduct.id === productId) {
      const bridge = composerInputFromDigitalMenuProduct(menuProduct);
      setProduct(bridge.product);
      setPreloadedNode(bridge.node);
      setLoadingProduct(false);
      return;
    }

    setLoadingProduct(true);
    void getProductById(productId)
      .then((result) => {
        setProduct(result as Product);
        setPreloadedNode(null);
      })
      .catch(() => toast.error("Produto não encontrado."))
      .finally(() => setLoadingProduct(false));
  }, [open, productId, menuProduct]);

  const sheetTitle = useMemo(
    () => product?.name ?? menuProduct?.name ?? "Produto",
    [product?.name, menuProduct?.name]
  );

  const handleConfirm = () => {
    const result = composer.confirm("delivery");
    if (!result.valid) {
      toast.error(result.errors[0] ?? "Seleção inválida.");
      return;
    }

    if (result.cartInput) {
      onAddToCart(result);
      toast.success("Item adicionado ao carrinho.");
      onClose();
    }
  };

  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={sheetTitle}
      placement="center"
      panelClassName="shadow-2xl digital-sheet-enter"
      panelStyle={sheetPanelStyle(theme)}
    >
      <MenuPreviewRegion id="productsheet">
      <div className="p-5" style={{ fontFamily: theme.fontFamily }}>
        {loadingProduct || !product ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2
              className="digital-spin h-8 w-8 animate-spin"
              style={{ color: theme.mutedTextColor }}
            />
          </div>
        ) : (
          <>
            <ProductHero
              product={product}
              theme={theme}
              displayPrice={Number(product.price)}
              promotionalPrice={product.promotionalPrice ?? null}
            />
            <ProductComposerView
              productName={product.name}
              basePrice={digitalBase}
              loading={composer.loading}
              blocked={composer.blocked}
              blockedReason={composer.blockedReason}
              node={composer.node}
              selections={composer.selections}
              quantity={composer.quantity}
              observation={composer.observation}
              validationErrors={composer.validation?.errors ?? []}
              unitPrice={digitalUnitPrice}
              lineTotal={digitalLineTotal}
              onToggleOption={composer.toggleOption}
              onOptionQuantityChange={composer.setOptionQuantity}
              onQuantityChange={composer.setQuantity}
              onObservationChange={composer.setObservation}
              onConfirm={handleConfirm}
              onCancel={onClose}
              confirmLabel={`Adicionar ao pedido · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(digitalLineTotal)}`}
              maxQuantity={Math.max(1, product.stock)}
              visualTone="digital"
            />
          </>
        )}
      </div>
      </MenuPreviewRegion>
    </AppSheet>
  );
}
