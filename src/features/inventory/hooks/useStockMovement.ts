import { useCallback, useState } from "react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventory.service";
import type { StockMovementType } from "../types/inventory";

interface RegisterMovementParams {
  productId: string;
  movementType: Extract<StockMovementType, "entry" | "exit">;
  quantity: number;
  notes?: string;
  onSuccess?: () => void;
}

export function useStockMovement() {
  const [loading, setLoading] = useState(false);

  const registerMovement = useCallback(
    async ({
      productId,
      movementType,
      quantity,
      notes,
      onSuccess,
    }: RegisterMovementParams) => {
      if (!productId) {
        toast.error("Selecione um produto");
        return null;
      }

      if (quantity <= 0) {
        toast.error("Informe uma quantidade válida");
        return null;
      }

      try {
        setLoading(true);

        const result =
          movementType === "entry"
            ? await inventoryService.registerEntry(
                productId,
                quantity,
                notes
              )
            : await inventoryService.registerExit(
                productId,
                quantity,
                notes
              );

        const actionLabel =
          movementType === "entry" ? "Entrada" : "Saída";

        toast.success(
          `${actionLabel} registrada: ${result.product_name} (${result.previous_stock} → ${result.new_stock})`
        );

        onSuccess?.();
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao registrar movimentação";

        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateMinStock = useCallback(
    async (productId: string, minStock: number, onSuccess?: () => void) => {
      if (minStock < 0) {
        toast.error("Estoque mínimo inválido");
        return null;
      }

      try {
        setLoading(true);
        await inventoryService.updateMinStock(productId, minStock);
        toast.success("Estoque mínimo atualizado");
        onSuccess?.();
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar estoque mínimo";

        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    registerMovement,
    updateMinStock,
    loading,
  };
}
