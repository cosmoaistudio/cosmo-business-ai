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
import type {
  ExpenseCategory,
  FinancialTransactionType,
  IncomeCategory,
} from "../types/finance";
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
} from "../types/finance";

interface TransactionDialogProps {
  open: boolean;
  transactionType: FinancialTransactionType;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (params: {
    type: FinancialTransactionType;
    category: IncomeCategory | ExpenseCategory;
    description: string;
    amount: number;
    transaction_date: string;
    notes?: string;
  }) => void;
}

export default function TransactionDialog({
  open,
  transactionType,
  loading = false,
  onClose,
  onConfirm,
}: TransactionDialogProps) {
  const isIncome = transactionType === "income";
  const [category, setCategory] = useState<string>(
    isIncome ? "service" : "other_expense"
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setCategory(isIncome ? "service" : "other_expense");
      setDescription("");
      setAmount("");
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open, isIncome]);

  const parsedAmount = Number.parseFloat(amount) || 0;
  const canConfirm =
    description.trim().length > 0 && parsedAmount > 0 && !loading;

  const categories = isIncome
    ? Object.entries(INCOME_CATEGORY_LABELS)
    : Object.entries(EXPENSE_CATEGORY_LABELS);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isIncome ? "Registrar entrada" : "Registrar despesa"}
          </DialogTitle>
          <DialogDescription>
            {isIncome
              ? "Adicione uma entrada manual ao fluxo de caixa."
              : "Registre uma saída ou despesa operacional."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="transaction-category"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Categoria
            </label>
            <select
              id="transaction-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Descrição
            </label>
            <Input
              id="transaction-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                isIncome ? "Ex: Serviço de consultoria" : "Ex: Conta de luz"
              }
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="transaction-amount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Valor
              </label>
              <Input
                id="transaction-amount"
                type="number"
                min={0.01}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Data
              </label>
              <Input
                id="transaction-date"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="transaction-notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Observação
            </label>
            <textarea
              id="transaction-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Opcional"
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
                type: transactionType,
                category: category as IncomeCategory | ExpenseCategory,
                description: description.trim(),
                amount: parsedAmount,
                transaction_date: transactionDate,
                notes: notes.trim() || undefined,
              })
            }
          >
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
