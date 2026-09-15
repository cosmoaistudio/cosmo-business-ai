import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import {
  ProductCreateTypeDialog,
  ProductModal,
  type CreateProductIntent,
} from "@/features/products";

interface Props {
  reload: () => void;
  /** Increment to open the create-product flow from outside (contextual CTA). */
  openCreateRequest?: number;
  categorySuggestions?: string[];
  onProductSaved?: () => void | Promise<void>;
  onAddonChanged?: () => void | Promise<void>;
}

export default function ProductsHeader({
  reload,
  openCreateRequest = 0,
  categorySuggestions = [],
  onProductSaved,
  onAddonChanged,
}: Props) {
  const navigate = useNavigate();
  const [typeOpen, setTypeOpen] = useState(false);
  const [createIntent, setCreateIntent] = useState<CreateProductIntent | null>(
    null
  );

  useEffect(() => {
    if (openCreateRequest > 0) {
      setTypeOpen(true);
    }
  }, [openCreateRequest]);

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Simples, copos montados e combos."
        action={
          <Button className="rounded-xl" onClick={() => setTypeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar produto
          </Button>
        }
      />

      {typeOpen && (
        <ProductCreateTypeDialog
          onClose={() => setTypeOpen(false)}
          onChoose={(intent) => {
            setTypeOpen(false);
            setCreateIntent(intent);
          }}
        />
      )}

      {createIntent && (
        <ProductModal
          createIntent={createIntent}
          categorySuggestions={categorySuggestions}
          onClose={() => setCreateIntent(null)}
          onAddonChanged={() => void onAddonChanged?.()}
          onSaved={(productId) => {
            reload();
            void onProductSaved?.();
            if (createIntent === "assembled" && productId) {
              setCreateIntent(null);
              void navigate(`/produtos/builder/${productId}`);
              return;
            }
          }}
        />
      )}
    </>
  );
}
