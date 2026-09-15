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
import { formatCurrency } from "@/lib/format";
import PaymentSelector from "./PaymentSelector";
import { CustomerSelector } from "@/features/customers";
import type { Customer } from "@/features/customers";
import type { CartSummary } from "../types/cart";
import type { PaymentMethod } from "../types/sale";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  summary: CartSummary;
  loading: boolean;
  customer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  onConfirm: (params: {
    paymentMethod: PaymentMethod;
    paymentAmount: number;
  }) => void;
}

export default function CheckoutDialog({
  open,
  onClose,
  summary,
  loading,
  customer,
  onCustomerChange,
  onConfirm,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    if (open) {
      setPaymentMethod("cash");
      setPaymentAmount(summary.total.toFixed(2));
    }
  }, [open, summary.total]);

  useEffect(() => {
    if (paymentMethod !== "cash") {
      setPaymentAmount(summary.total.toFixed(2));
    }
  }, [paymentMethod, summary.total]);

  const parsedAmount = Number.parseFloat(paymentAmount) || 0;
  const changeAmount = Math.max(parsedAmount - summary.total, 0);
  const canConfirm =
    parsedAmount >= summary.total && summary.total > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar venda</DialogTitle>
          <DialogDescription>
            Selecione a forma de pagamento e confirme o valor recebido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Total da venda</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(summary.total)}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">
              Forma de pagamento
            </p>
            <PaymentSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>

          <CustomerSelector value={customer} onChange={onCustomerChange} />

          <div>
            <label
              htmlFor="payment-amount"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {paymentMethod === "cash" ? "Valor recebido" : "Valor pago"}
            </label>
            <Input
              id="payment-amount"
              type="number"
              min={summary.total}
              step="0.01"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              readOnly={paymentMethod !== "cash"}
              className="rounded-xl"
            />
          </div>

          {paymentMethod === "cash" && changeAmount > 0 && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
              <span className="text-green-700">Troco: </span>
              <span className="font-bold text-green-800">
                {formatCurrency(changeAmount)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                paymentMethod,
                paymentAmount: parsedAmount,
              })
            }
          >
            {loading ? "Processando..." : "Confirmar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
