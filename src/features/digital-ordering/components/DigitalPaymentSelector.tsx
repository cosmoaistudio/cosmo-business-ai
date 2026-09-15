import { CreditCard, QrCode, Wallet } from "lucide-react";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/features/pdv/types/sale";

interface DigitalPaymentSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  allowCounter?: boolean;
  pixEnabled?: boolean;
  cardEnabled?: boolean;
}

const METHODS: Array<{
  id: PaymentMethod;
  icon: typeof Wallet;
  enabled?: (props: DigitalPaymentSelectorProps) => boolean;
}> = [
  { id: "pix", icon: QrCode, enabled: (p) => p.pixEnabled !== false },
  {
    id: "credit_card",
    icon: CreditCard,
    enabled: (p) => p.cardEnabled === true,
  },
  {
    id: "debit_card",
    icon: CreditCard,
    enabled: (p) => p.cardEnabled === true,
  },
  {
    id: "cash",
    icon: Wallet,
    enabled: (p) => p.allowCounter !== false,
  },
];

export default function DigitalPaymentSelector(props: DigitalPaymentSelectorProps) {
  const { value, onChange } = props;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {METHODS.filter((method) => method.enabled?.(props) !== false).map(
        ({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
              value === id
                ? "border-blue-400 bg-blue-500/20"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{PAYMENT_METHOD_LABELS[id]}</span>
          </button>
        )
      )}
    </div>
  );
}
