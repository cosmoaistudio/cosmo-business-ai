import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/features/products";
import type { StockMovementType } from "../types/inventory";

interface StockMovementDialogProps {
  open: boolean;
  movementType: Extract<StockMovementType, "entry" | "exit">;
  products: Product[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (params: {
    productId: string;
    quantity: number;
    notes?: string;
  }) => void;
}

export default function StockMovementDialog({
  open,
  movementType,
  products,
  loading = false,
  onClose,
  onConfirm,
}: StockMovementDialogProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const isEntry = movementType === "entry";
  const title = isEntry ? "Entrada de estoque" : "Saída manual";
  const selectedProduct = products.find((product) => product.id === productId);

  useEffect(() => {
    if (open) {
      setProductId("");
      setQuantity("");
      setNotes("");
    }
  }, [open, movementType]);

  const parsedQuantity = Number.parseInt(quantity, 10) || 0;
  const canConfirm =
    Boolean(productId) &&
    parsedQuantity > 0 &&
    !loading &&
    (!selectedProduct ||
      isEntry ||
      parsedQuantity <= selectedProduct.stock);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEntry
              ? "Registre a entrada de produtos no estoque."
              : "Registre a saída manual de produtos do estoque."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="movement-product"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Produto
            </label>
            <select
              id="movement-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (estoque: {product.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movement-quantity"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Quantidade
            </label>
            <Input
              id="movement-quantity"
              type="number"
              min={1}
              max={!isEntry ? selectedProduct?.stock : undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="rounded-xl"
              placeholder="0"
            />
            {!isEntry && selectedProduct && (
              <p className="mt-2 text-xs text-slate-500">
                Disponível: {selectedProduct.stock} unidades
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="movement-notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Observação
            </label>
            <textarea
              id="movement-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Motivo da movimentação..."
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                productId,
                quantity: parsedQuantity,
                notes: notes.trim() || undefined,
              })
            }
          >
            {loading ? "Registrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
