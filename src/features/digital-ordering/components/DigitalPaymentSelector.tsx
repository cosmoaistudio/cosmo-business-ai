import { CreditCard, QrCode, Wallet } from "lucide-react";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/features/pdv/types/sale";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  radiusToCss,
  selectableSurfaceStyle,
} from "../menu/theme/menuTheme";

interface DigitalPaymentSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  allowCounter?: boolean;
  pixEnabled?: boolean;
  cardEnabled?: boolean;
  theme?: MenuTheme;
}

const METHOD_COPY: Record<
  PaymentMethod,
  { description: string; icon: typeof Wallet }
> = {
  pix: {
    description: "Pagamento instantâneo",
    icon: QrCode,
  },
  cash: {
    description: "Pague na entrega ou retirada",
    icon: Wallet,
  },
  credit_card: {
    description: "Crédito na entrega",
    icon: CreditCard,
  },
  debit_card: {
    description: "Débito na entrega",
    icon: CreditCard,
  },
};

const METHODS: Array<{
  id: PaymentMethod;
  enabled?: (props: DigitalPaymentSelectorProps) => boolean;
}> = [
  { id: "pix", enabled: (p) => p.pixEnabled !== false },
  {
    id: "credit_card",
    enabled: (p) => p.cardEnabled === true,
  },
  {
    id: "debit_card",
    enabled: (p) => p.cardEnabled === true,
  },
  {
    id: "cash",
    enabled: (p) => p.allowCounter !== false,
  },
];

export default function DigitalPaymentSelector(props: DigitalPaymentSelectorProps) {
  const { value, onChange, theme = DEFAULT_MENU_THEME } = props;

  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      role="group"
      aria-label="Forma de pagamento"
    >
      {METHODS.filter((method) => method.enabled?.(props) !== false).map(
        ({ id }) => {
          const selected = value === id;
          const copy = METHOD_COPY[id];
          const Icon = copy.icon;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={selected}
              className="digital-focus-ring digital-motion-press flex items-start gap-3 border px-4 py-4 text-left"
              style={selectableSurfaceStyle(theme, selected)}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center"
                style={{
                  borderRadius: radiusToCss(theme.buttonRadius),
                  backgroundColor: selected
                    ? theme.primaryColor
                    : theme.surfaceMuted,
                  color: selected ? "#ffffff" : theme.mutedTextColor,
                }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span
                  className="block font-semibold"
                  style={{ color: theme.textColor }}
                >
                  {PAYMENT_METHOD_LABELS[id]}
                </span>
                <span
                  className="mt-0.5 block text-xs"
                  style={{ color: theme.mutedTextColor }}
                >
                  {copy.description}
                </span>
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}
