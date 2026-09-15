import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import AppSheet from "@/components/shared/AppSheet";
import { ProductComposerView, useProductComposer } from "@/features/product-engine";
import { getProductById } from "@/features/products/repository/products.repository";
import type { Product } from "@/features/products/types/product";
import type { ComposerConfirmResult } from "@/features/product-engine/integrations/cart.adapter";

interface DigitalProductSheetProps {
  productId: string | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (result: ComposerConfirmResult) => void;
}

export default function DigitalProductSheet({
  productId,
  open,
  onClose,
  onAddToCart,
}: DigitalProductSheetProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const composer = useProductComposer(product);

  useEffect(() => {
    if (!open || !productId) {
      setProduct(null);
      return;
    }

    setLoadingProduct(true);
    void getProductById(productId)
      .then((result) => setProduct(result as Product))
      .catch(() => toast.error("Produto não encontrado."))
      .finally(() => setLoadingProduct(false));
  }, [open, productId]);

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
      title={product?.name ?? "Produto"}
      placement="center"
      panelClassName="bg-white text-slate-900 shadow-2xl"
    >
      <div className="p-5">
        {loadingProduct || !product ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
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
            unitPrice={
              composer.pricing
                ? composer.pricing.basePrice +
                  composer.pricing.addonsTotal +
                  composer.pricing.premiumTotal
                : Number(product.price)
            }
            lineTotal={
              composer.pricing?.total ??
              Number(product.price) * composer.quantity
            }
            onToggleOption={composer.toggleOption}
            onOptionQuantityChange={composer.setOptionQuantity}
            onQuantityChange={composer.setQuantity}
            onObservationChange={composer.setObservation}
            onConfirm={handleConfirm}
            onCancel={onClose}
            confirmLabel="Adicionar ao carrinho"
            maxQuantity={product.stock}
          />
        )}
      </div>
    </AppSheet>
  );
}
