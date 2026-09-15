import type { PaymentMethod } from "../types/sale";
import { PAYMENT_METHOD_LABELS } from "../types/sale";

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "credit_card",
  "debit_card",
  "pix",
];

interface PaymentSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentSelector({
  value,
  onChange,
}: PaymentSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            value === method
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {PAYMENT_METHOD_LABELS[method]}
        </button>
      ))}
    </div>
  );
}
