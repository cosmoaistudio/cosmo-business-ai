import { useCallback, useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { financeService } from "../services/finance.service";
import type { CreateFinancialTransactionDTO } from "../types/finance";

export function useFinanceTransaction() {
  const [loading, setLoading] = useState(false);

  const createTransaction = useCallback(
    async (
      payload: CreateFinancialTransactionDTO,
      onSuccess?: () => void
    ) => {
      if (!payload.description.trim()) {
        toast.error("Informe uma descrição");
        return null;
      }

      if (payload.amount <= 0) {
        toast.error("Informe um valor válido");
        return null;
      }

      try {
        setLoading(true);
        await financeService.createTransaction(payload);

        toast.success(
          payload.type === "income"
            ? "Entrada registrada com sucesso"
            : "Despesa registrada com sucesso"
        );

        emitDataChanged();
        onSuccess?.();
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao registrar lançamento";

        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteTransaction = useCallback(
    async (id: string, onSuccess?: () => void) => {
      try {
        setLoading(true);
        await financeService.deleteTransaction(id);
        toast.success("Lançamento removido");
        emitDataChanged();
        onSuccess?.();
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao remover lançamento";

        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createTransaction,
    deleteTransaction,
    loading,
  };
}
