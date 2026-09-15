import { Loader2 } from "lucide-react";
import AppSheet from "@/components/shared/AppSheet";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import DigitalCouponInput from "./DigitalCouponInput";
import DigitalPaymentSelector from "./DigitalPaymentSelector";

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
  deliveryAddress?: string;
  showDeliveryFields?: boolean;
  couponCode?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onPaymentChange: (method: PaymentMethod) => void;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onDeliveryAddressChange?: (value: string) => void;
  onApplyCoupon: (code: string) => { success: boolean; error?: string };
  onRemoveCoupon: () => void;
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
  deliveryAddress = "",
  showDeliveryFields = false,
  couponCode,
  onClose,
  onConfirm,
  onPaymentChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeliveryAddressChange,
  onApplyCoupon,
  onRemoveCoupon,
}: DigitalCheckoutSheetProps) {
  const belowMinimum = minimumOrder > 0 && subtotal < minimumOrder;

  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title="Finalizar pedido"
      placement="bottom"
      panelClassName="bg-slate-950 text-white shadow-2xl"
      footer={
        <button
          type="button"
          disabled={loading || belowMinimum}
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-semibold disabled:opacity-40"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          Confirmar pedido
        </button>
      }
    >
      <div className="space-y-4 p-6">
        <input
          value={customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Seu nome"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          value={customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value)}
          placeholder="Telefone / WhatsApp"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />

        {showDeliveryFields && onDeliveryAddressChange && (
          <textarea
            value={deliveryAddress}
            onChange={(event) => onDeliveryAddressChange(event.target.value)}
            placeholder="Endereço completo para entrega"
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          />
        )}

        <DigitalCouponInput
          activeCode={couponCode}
          onApply={onApplyCoupon}
          onRemove={onRemoveCoupon}
        />

        <div>
          <p className="mb-3 text-sm text-slate-300">Forma de pagamento</p>
          <DigitalPaymentSelector
            value={paymentMethod}
            onChange={onPaymentChange}
            pixEnabled
            cardEnabled={false}
            allowCounter
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="mt-1 flex justify-between">
              <span>Entrega</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {belowMinimum && (
          <p className="text-sm text-amber-300">
            Pedido mínimo: {formatCurrency(minimumOrder)}
          </p>
        )}
      </div>
    </AppSheet>
  );
}
