import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import ProductModal from "@/features/products/components/ProductModal";

interface Props {
  reload: () => void;
}

export default function ProductsHeader({ reload }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Gerencie todos os produtos da sua empresa."
        action={
          <Button
            className="rounded-xl"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        }
      />

      {open && (
        <ProductModal
          onClose={() => setOpen(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}