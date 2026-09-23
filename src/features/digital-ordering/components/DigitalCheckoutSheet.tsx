import type { ReactNode } from "react";
import { Loader2, Store, Truck } from "lucide-react";
import AppSheet from "@/components/shared/AppSheet";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalDeliveryAddress } from "../types/digitalOrdering.types";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  inputStyle,
  radiusToCss,
  selectableSurfaceStyle,
  sheetPanelStyle,
} from "../menu/theme/menuTheme";
import type { CheckoutFulfillmentMode } from "../utils/checkoutFulfillment";
import {
  EMPTY_DELIVERY_ADDRESS,
  type DeliveryAddressErrors,
} from "../utils/deliveryAddress";
import DigitalCouponInput from "./DigitalCouponInput";
import DigitalDeliveryAddressForm from "./DigitalDeliveryAddressForm";
import DigitalPaymentSelector from "./DigitalPaymentSelector";
import MenuPreviewRegion from "../menu/admin/editor/MenuPreviewRegion";
import type { PreviewOrderContext } from "../menu/theme/previewOrderContext";

interface DigitalCheckoutSheetProps {
  open: boolean;
  total: number;
  subtotal: number;
  minimumOrder: number;
  deliveryFee: number;
  loading: boolean;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  /** Valor em dinheiro com o qual o cliente vai pagar (troco). Vazio = sem troco. */
  cashTendered?: string;
  deliveryAddress?: DigitalDeliveryAddress;
  deliveryAddressErrors?: DeliveryAddressErrors;
  showDeliveryFields?: boolean;
  tableLabel?: string | null;
  fulfillmentOptions?: CheckoutFulfillmentMode[];
  selectedFulfillment?: CheckoutFulfillmentMode | null;
  showFulfillmentSelector?: boolean;
  couponCode?: string | null;
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onCashTenderedChange?: (value: string) => void;
  onDeliveryAddressChange?: (value: DigitalDeliveryAddress) => void;
  onFulfillmentChange?: (mode: CheckoutFulfillmentMode) => void;
  onApplyCoupon: (code: string) => { success: boolean; error?: string };
  onRemoveCoupon: () => void;
  theme?: MenuTheme;
  /** Editor inspect only — demo totals, never the live cart. */
  previewOrder?: PreviewOrderContext | null;
}

const FULFILLMENT_COPY: Record<
  CheckoutFulfillmentMode,
  { title: string; description: string; Icon: typeof Truck }
> = {
  delivery: {
    title: "Delivery",
    description: "Receba seu pedido no endereço informado",
    Icon: Truck,
  },
  pickup: {
    title: "Retirada",
    description: "Retire seu pedido na loja",
    Icon: Store,
  },
};

function Section({
  step,
  title,
  theme,
  children,
  filled,
}: {
  step: string;
  title: string;
  theme: MenuTheme;
  children: ReactNode;
  filled?: boolean;
}) {
  return (
    <section
      className="space-y-3 border p-4 transition duration-200 motion-reduce:transition-none"
      style={{
        backgroundColor: theme.surfaceColor,
        borderColor: filled
          ? `color-mix(in srgb, ${theme.primaryColor} 45%, ${theme.borderColor})`
          : theme.borderColor,
        borderRadius: radiusToCss(theme.cardRadius),
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-6 min-w-6 items-center justify-center px-1.5 text-[11px] font-bold tabular-nums"
          style={{
            backgroundColor: filled
              ? theme.primaryColor
              : theme.surfaceMuted,
            color: filled ? "#fff" : theme.mutedTextColor,
            borderRadius: radiusToCss(theme.buttonRadius),
          }}
          aria-hidden
        >
          {step}
        </span>
        <h3
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: theme.mutedTextColor,
            fontFamily: theme.headingFontFamily,
          }}
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export default function DigitalCheckoutSheet({
  open,
  total,
  subtotal,
  minimumOrder,
  deliveryFee,
  loading,
  paymentMethod,
  customerName,
  customerPhone,
  cashTendered = "",
  deliveryAddress = EMPTY_DELIVERY_ADDRESS,
  deliveryAddressErrors = {},
  showDeliveryFields = false,
  tableLabel = null,
  fulfillmentOptions = [],
  selectedFulfillment = null,
  showFulfillmentSelector = false,
  couponCode,
  confirmDisabled = false,
  onClose,
  onConfirm,
  onPaymentChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCashTenderedChange,
  onDeliveryAddressChange,
  onFulfillmentChange,
  onApplyCoupon,
  onRemoveCoupon,
  theme = DEFAULT_MENU_THEME,
  previewOrder = null,
}: DigitalCheckoutSheetProps) {
  const belowMinimum = minimumOrder > 0 && subtotal < minimumOrder;
  const tenderedNumber = Number(String(cashTendered).replace(",", "."));
  const cashChange =
    paymentMethod === "cash" &&
    Number.isFinite(tenderedNumber) &&
    tenderedNumber > total
      ? tenderedNumber - total
      : 0;
  const cashTenderedInvalid =
    paymentMethod === "cash" &&
    cashTendered.trim().length > 0 &&
    (!Number.isFinite(tenderedNumber) || tenderedNumber < total);
  const singleFulfillment =
    !showFulfillmentSelector &&
    fulfillmentOptions.length === 1 &&
    selectedFulfillment &&
    fulfillmentOptions[0] === selectedFulfillment
      ? selectedFulfillment
      : null;

  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title="Finalizar pedido"
      placement="bottom"
      panelClassName="shadow-2xl digital-sheet-enter max-w-lg sm:max-w-xl md:max-w-2xl"
      panelStyle={sheetPanelStyle(theme)}
      footer={
        <button
          type="button"
          disabled={
            loading || belowMinimum || confirmDisabled || cashTenderedInvalid
          }
          onClick={onConfirm}
          className="digital-focus-ring digital-motion-press flex w-full items-center justify-center gap-2 py-4 font-semibold disabled:opacity-40"
          style={buttonStyleFor(theme)}
        >
          {loading && (
            <Loader2 className="digital-spin h-5 w-5 animate-spin" aria-hidden />
          )}
          Finalizar pedido · {formatCurrency(total)}
        </button>
      }
    >
      <MenuPreviewRegion id="checkout">
      <div
        className="space-y-6 p-6 pb-8"
        style={{ fontFamily: theme.fontFamily }}
      >
        {previewOrder?.demo ? (
          <div
            className="border px-4 py-3"
            style={{
              borderRadius: radiusToCss(theme.cardRadius),
              borderColor: theme.borderColor,
              backgroundColor: theme.surfaceMuted,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.mutedTextColor }}
            >
              Preview do checkout
            </p>
            <p
              className="mt-1 text-sm font-semibold"
              style={{ color: theme.textColor }}
            >
              {previewOrder.productName} × {previewOrder.quantity}
            </p>
            <p className="mt-1 text-xs" style={{ color: theme.mutedTextColor }}>
              Valores demonstrativos. O carrinho real não é alterado.
            </p>
          </div>
        ) : null}

        {tableLabel ? (
          <div
            className="border px-4 py-3"
            style={{
              borderRadius: radiusToCss(theme.cardRadius),
              borderColor: "color-mix(in srgb, #f59e0b 35%, transparent)",
              backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
              Pedido para mesa
            </p>
            <p
              className="mt-1 text-base font-semibold"
              style={{ color: theme.textColor }}
            >
              {tableLabel}
            </p>
          </div>
        ) : null}

        <Section
          step="01"
          title="Cliente"
          theme={theme}
          filled={customerName.trim().length > 0 || customerPhone.trim().length > 0}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="checkout-customer-name"
                className="text-xs font-medium"
                style={{ color: theme.mutedTextColor }}
              >
                Seu nome
              </label>
              <input
                id="checkout-customer-name"
                value={customerName}
                onChange={(event) => onCustomerNameChange(event.target.value)}
                placeholder="Como devemos chamar você"
                autoComplete="name"
                className="digital-focus-ring w-full border px-4 py-3 text-sm outline-none"
                style={inputStyle(theme)}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="checkout-customer-phone"
                className="text-xs font-medium"
                style={{ color: theme.mutedTextColor }}
              >
                Telefone / WhatsApp
              </label>
              <input
                id="checkout-customer-phone"
                value={customerPhone}
                onChange={(event) => onCustomerPhoneChange(event.target.value)}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                autoComplete="tel"
                className="digital-focus-ring w-full border px-4 py-3 text-sm outline-none"
                style={inputStyle(theme)}
              />
            </div>
          </div>
        </Section>

        <Section
          step="02"
          title="Entrega / Retirada"
          theme={theme}
          filled={Boolean(selectedFulfillment || singleFulfillment)}
        >
          {showFulfillmentSelector && onFulfillmentChange ? (
            <div className="grid gap-3">
              {fulfillmentOptions.map((option) => {
                const copy = FULFILLMENT_COPY[option];
                const selected = selectedFulfillment === option;
                const Icon = copy.Icon;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onFulfillmentChange(option)}
                    aria-pressed={selected}
                    data-fulfillment={option}
                    className="digital-focus-ring digital-motion-press flex w-full items-start gap-3 border px-4 py-3 text-left"
                    style={selectableSurfaceStyle(theme, selected)}
                  >
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: radiusToCss(theme.buttonRadius),
                        backgroundColor: selected
                          ? theme.primaryColor
                          : theme.borderColor,
                        color: selected ? "#ffffff" : theme.textColor,
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        {copy.title}
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
              })}
            </div>
          ) : null}

          {singleFulfillment ? (
            <div
              data-fulfillment={singleFulfillment}
              data-fulfillment-locked="true"
              className="flex w-full items-start gap-3 border px-4 py-3"
              style={selectableSurfaceStyle(theme, true)}
            >
              {(() => {
                const copy = FULFILLMENT_COPY[singleFulfillment];
                const Icon = copy.Icon;
                return (
                  <>
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: radiusToCss(theme.buttonRadius),
                        backgroundColor: theme.primaryColor,
                        color: "#ffffff",
                      }}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block text-sm font-semibold"
                        style={{ color: theme.textColor }}
                      >
                        {copy.title}
                      </span>
                      <span
                        className="mt-0.5 block text-xs"
                        style={{ color: theme.mutedTextColor }}
                      >
                        {copy.description}
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>
          ) : null}
        </Section>

        <Section
          step="03"
          title="Endereço"
          theme={theme}
          filled={showDeliveryFields && Boolean(deliveryAddress.street)}
        >
          {showDeliveryFields && onDeliveryAddressChange ? (
            <DigitalDeliveryAddressForm
              value={deliveryAddress}
              errors={deliveryAddressErrors}
              onChange={onDeliveryAddressChange}
              theme={theme}
            />
          ) : (
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>
              {selectedFulfillment === "delivery" || singleFulfillment === "delivery"
                ? "Informe o endereço de entrega acima ou troque o modo."
                : "Retirada na loja — endereço não é necessário."}
            </p>
          )}
        </Section>

        <Section
          step="04"
          title="Pagamento"
          theme={theme}
          filled={Boolean(paymentMethod)}
        >
          <DigitalPaymentSelector
            value={paymentMethod}
            onChange={onPaymentChange}
            pixEnabled
            cardEnabled={false}
            allowCounter
            theme={theme}
          />

          {paymentMethod === "cash" && onCashTenderedChange ? (
            <div
              className="mt-3 space-y-2 border p-4"
              style={{
                borderColor: theme.borderColor,
                borderRadius: radiusToCss(theme.buttonRadius),
                backgroundColor: theme.surfaceMuted,
              }}
            >
              <label
                htmlFor="checkout-cash-tendered"
                className="text-sm"
                style={{ color: theme.mutedTextColor }}
              >
                Troco para
              </label>
              <input
                id="checkout-cash-tendered"
                value={cashTendered}
                onChange={(event) => onCashTenderedChange(event.target.value)}
                placeholder="Deixe vazio se não precisar de troco"
                inputMode="decimal"
                className="digital-focus-ring w-full border px-4 py-3 text-sm outline-none"
                style={inputStyle(theme)}
              />
              {cashTendered.trim().length === 0 ? (
                <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                  Sem troco
                </p>
              ) : cashTenderedInvalid ? (
                <p
                  className="text-xs"
                  role="alert"
                  style={{ color: theme.warningColor }}
                >
                  O valor precisa ser maior ou igual ao total (
                  {formatCurrency(total)}).
                </p>
              ) : cashChange > 0 ? (
                <p className="text-xs" style={{ color: theme.successColor }}>
                  Troco: {formatCurrency(cashChange)}
                </p>
              ) : (
                <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                  Sem troco
                </p>
              )}
            </div>
          ) : null}
        </Section>

        <Section step="05" title="Observações / cupom" theme={theme}>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: theme.mutedTextColor }}>Subtotal</span>
              <span style={{ color: theme.textColor }}>
                {formatCurrency(subtotal)}
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span style={{ color: theme.mutedTextColor }}>Entrega</span>
                <span style={{ color: theme.textColor }}>
                  {formatCurrency(deliveryFee)}
                </span>
              </div>
            )}
          </div>
          <DigitalCouponInput
            activeCode={couponCode}
            onApply={onApplyCoupon}
            onRemove={onRemoveCoupon}
            theme={theme}
          />
          {belowMinimum && (
            <p
              className="text-sm"
              role="alert"
              style={{ color: theme.warningColor }}
            >
              Pedido mínimo: {formatCurrency(minimumOrder)}
            </p>
          )}
        </Section>

        <Section step="06" title="Resumo" theme={theme} filled>
          <div className="flex items-center justify-between text-lg font-bold">
            <span style={{ color: theme.textColor }}>Total a pagar</span>
            <span className="tabular-nums" style={{ color: theme.primaryColor }}>
              {formatCurrency(total)}
            </span>
          </div>
        </Section>
      </div>
      </MenuPreviewRegion>
    </AppSheet>
  );
}
