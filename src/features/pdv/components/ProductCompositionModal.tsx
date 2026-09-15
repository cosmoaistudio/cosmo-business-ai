import { toast } from "sonner";
import AppModal from "@/components/shared/AppModal";
import type { Product } from "@/features/products";
import {
  ProductComposerView,
  useProductComposer,
  type ComposerInitialState,
} from "@/features/product-engine";
import type { AddCartItemInput } from "../types/cart";

interface ProductCompositionModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onConfirm: (input: AddCartItemInput) => void;
  initial?: ComposerInitialState | null;
  confirmLabel?: string;
}

export default function ProductCompositionModal({
  product,
  open,
  onClose,
  onConfirm,
  initial = null,
  confirmLabel = "Adicionar ao carrinho",
}: ProductCompositionModalProps) {
  const composer = useProductComposer(open ? product : null, initial);

  if (!open) return null;

  function handleConfirm() {
    const result = composer.confirm("pdv");

    if (!result.valid || !result.cartInput) {
      toast.error(result.errors[0] ?? "Complete as opções obrigatórias.");
      return;
    }

    if (result.cartInput.quantity > product.stock) {
      toast.error("Quantidade inválida para o estoque disponível.");
      return;
    }

    onConfirm(result.cartInput);
    onClose();
  }

  return (
    <AppModal
      title={product.name}
      onClose={onClose}
      size="xl"
      closeOnEsc
    >
      <p className="mb-4 -mt-2 text-sm text-slate-500">
        Monte o produto com poucos toques. Busque adicionais e ajuste quantidades.
      </p>
      <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200">
        <ProductComposerView
          productName={product.name}
          basePrice={composer.node?.basePrice ?? Number(product.price)}
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
          confirmLabel={confirmLabel}
          maxQuantity={product.stock}
        />
      </div>
    </AppModal>
  );
}
