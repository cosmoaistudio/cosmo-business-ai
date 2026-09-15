import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ComboCompositionModal from "@/features/pdv/components/ComboCompositionModal";
import type { AddCartItemInput, CartItem } from "@/features/pdv/types/cart";
import type { Product } from "@/features/products/types/product";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { fetchPublicComboDefinition } from "../repository/publicCombo.repository";

interface DigitalComboSheetProps {
  menuProduct: DigitalMenuProduct | null;
  storeSlug: string;
  open: boolean;
  editingItem?: CartItem | null;
  onClose: () => void;
  onConfirm: (input: AddCartItemInput) => void;
}

export default function DigitalComboSheet({
  menuProduct,
  storeSlug,
  open,
  editingItem,
  onClose,
  onConfirm,
}: DigitalComboSheetProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [preloadedNodes, setPreloadedNodes] = useState<
    Record<string, EngineProductNode>
  >({});
  const [loading, setLoading] = useState(false);
  const [definitionKey, setDefinitionKey] = useState(0);

  useEffect(() => {
    if (!open || !menuProduct) {
      setProduct(null);
      setPreloadedNodes({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchPublicComboDefinition(storeSlug, menuProduct.id)
      .then((definition) => {
        if (cancelled) return;
        setProduct(definition.product);
        setPreloadedNodes(definition.nodeByProductId);
        setDefinitionKey((key) => key + 1);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o combo."
        );
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // onClose intencionalmente omitido — evita loop ao falhar o fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menuProduct, storeSlug]);

  const componentsLoader = useCallback(
    async (comboProductId: string) => {
      const definition = await fetchPublicComboDefinition(
        storeSlug,
        comboProductId
      );
      setPreloadedNodes(definition.nodeByProductId);
      return definition.components;
    },
    [storeSlug]
  );

  if (!open || !menuProduct) return null;

  if (loading || !product) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-2xl bg-white px-6 py-5 text-slate-600 shadow-xl">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
          Carregando combo…
        </div>
      </div>
    );
  }

  return (
    <ComboCompositionModal
      key={`${product.id}:${definitionKey}:${editingItem?.id ?? "new"}`}
      product={product}
      editingItem={editingItem}
      componentsLoader={componentsLoader}
      preloadedNodes={preloadedNodes}
      confirmLabel="Adicionar ao pedido"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
