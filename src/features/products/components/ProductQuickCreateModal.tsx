import AppModal from "@/components/shared/AppModal";
import type { ProductMenuKind } from "../types/product";
import ProductForm from "./ProductForm";

interface ProductQuickCreateModalProps {
  menuKind: Extract<ProductMenuKind, "simple" | "assembled">;
  onClose: () => void;
  onSaved: (productId?: string) => void;
}

/**
 * Lightweight create-only modal (Dados). Used from combo catalog empty states
 * to avoid circular imports with ProductModal ↔ ComboComponentsEditor.
 */
export default function ProductQuickCreateModal({
  menuKind,
  onClose,
  onSaved,
}: ProductQuickCreateModalProps) {
  const title =
    menuKind === "assembled" ? "Novo copo montado" : "Novo produto simples";

  return (
    <AppModal title={title} onClose={onClose} size="lg">
      {menuKind === "assembled" ? (
        <p className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Após salvar, você pode montar os grupos no Product Builder.
        </p>
      ) : null}
      <ProductForm
        menuKind={menuKind}
        onCancel={onClose}
        onSuccess={(productId) => {
          onSaved(productId);
          onClose();
        }}
      />
    </AppModal>
  );
}
