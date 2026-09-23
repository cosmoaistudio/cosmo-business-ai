import { Store, Truck } from "lucide-react";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  radiusToCss,
  selectableSurfaceStyle,
} from "../menu/theme/menuTheme";
import type { CheckoutFulfillmentMode } from "../utils/checkoutFulfillment";

interface DigitalChannelSwitcherProps {
  options: CheckoutFulfillmentMode[];
  selected: CheckoutFulfillmentMode | null;
  onChange: (mode: CheckoutFulfillmentMode) => void;
  theme?: MenuTheme;
}

const COPY: Record<
  CheckoutFulfillmentMode,
  { title: string; short: string; Icon: typeof Truck }
> = {
  delivery: {
    title: "Delivery",
    short: "Receber no endereço",
    Icon: Truck,
  },
  pickup: {
    title: "Retirada",
    short: "Retirar na loja",
    Icon: Store,
  },
};

export default function DigitalChannelSwitcher({
  options,
  selected,
  onChange,
  theme = DEFAULT_MENU_THEME,
}: DigitalChannelSwitcherProps) {
  if (options.length < 2) return null;

  return (
    <div className="mb-5 grid grid-cols-2 gap-2" role="group" aria-label="Canal do pedido">
      {options.map((option) => {
        const copy = COPY[option];
        const Icon = copy.Icon;
        const active = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            data-channel-switch={option}
            className="digital-focus-ring digital-motion-press flex items-center gap-2 border px-3 py-3 text-left"
            style={selectableSurfaceStyle(theme, active)}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center"
              style={{
                borderRadius: radiusToCss(theme.buttonRadius),
                backgroundColor: active
                  ? theme.primaryColor
                  : theme.borderColor,
                color: active ? "#ffffff" : theme.textColor,
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span
                className="block text-sm font-semibold"
                style={{
                  color: theme.textColor,
                  fontFamily: theme.headingFontFamily,
                }}
              >
                {copy.title}
              </span>
              <span
                className="block truncate text-[11px]"
                style={{ color: theme.mutedTextColor }}
              >
                {copy.short}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
