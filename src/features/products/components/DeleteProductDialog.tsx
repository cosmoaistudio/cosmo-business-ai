import { useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { productsService } from "../services/products.service";
import type { Product } from "../types/product";

interface DeleteProductDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onDeleted,
}: DeleteProductDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      await productsService.remove(product.id);
      toast.success("Produto excluído com sucesso.");
      emitDataChanged();
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Não foi possível excluir o produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Excluir produto</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <strong>{product.name}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
