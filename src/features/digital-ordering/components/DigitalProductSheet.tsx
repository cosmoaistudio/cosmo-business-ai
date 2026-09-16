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
import { composerInputFromDigitalMenuProduct } from "../utils/digitalMenuComposerBridge";

interface DigitalProductSheetProps {
  productId: string | null;
  /** Snapshot item from the public catalog — preferred for anon /menu/:slug. */
  menuProduct?: DigitalMenuProduct | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (result: ComposerConfirmResult) => void;
}

/**
 * Image and description live here rather than inside ProductComposerView,
 * which is shared with the PDV and must keep its current layout.
 */
function ProductHero({ product }: { product: Product }) {
  const imageUrl = product.image_url ?? product.image ?? null;
  const description = product.description?.trim();

  if (!imageUrl && !description) return null;

  return (
    <div className="mb-4">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="mb-3 h-44 w-full rounded-2xl object-cover sm:h-52"
        />
      )}

      {description && (
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      )}
    </div>
  );
}

export default function DigitalProductSheet({
  productId,
  menuProduct = null,
  open,
  onClose,
  onAddToCart,
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
      panelClassName="bg-white text-slate-900 shadow-2xl"
    >
      <div className="p-5">
        {loadingProduct || !product ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <ProductHero product={product} />
            <ProductComposerView
              productName={product.name}
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
              confirmLabel="Adicionar ao carrinho"
              maxQuantity={Math.max(1, product.stock)}
            />
          </>
        )}
      </div>
    </AppSheet>
  );
}
