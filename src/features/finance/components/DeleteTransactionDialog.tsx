import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { FinancialTransaction } from "../types/finance";
import { TRANSACTION_TYPE_LABELS } from "../types/finance";

interface DeleteTransactionDialogProps {
  transaction: FinancialTransaction | null;
  open: boolean;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (transaction: FinancialTransaction) => Promise<void>;
}

export default function DeleteTransactionDialog({
  transaction,
  open,
  loading = false,
  onOpenChange,
  onConfirm,
}: DeleteTransactionDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!transaction) return;

    try {
      setDeleting(true);
      await onConfirm(transaction);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  const isBusy = loading || deleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isBusy}>
        <DialogHeader>
          <DialogTitle>Excluir lançamento</DialogTitle>
          <DialogDescription>
            {transaction ? (
              <>
                Tem certeza que deseja excluir o lançamento{" "}
                <strong>{transaction.description}</strong> (
                {TRANSACTION_TYPE_LABELS[transaction.type]},{" "}
                {formatCurrency(transaction.amount)})? Esta ação não pode ser
                desfeita.
              </>
            ) : (
              "Confirme a exclusão do lançamento selecionado."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isBusy || !transaction}
            onClick={handleDelete}
          >
            {isBusy ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
