import type { CartItem } from "@/features/pdv/types/cart";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import { mapCartUnitsToRpcComponents } from "@/features/pdv/utils/comboCartUnits";
import {
  findLocalDigitalOrder,
  fetchKitchenTicketStatusBySaleId,
  fetchPublicOrderStatus,
  fetchSaleSummary,
  placePublicDigitalOrder,
  saveLocalDigitalOrder,
  updateLocalDigitalOrderStatus,
} from "../repository/digitalOrdering.repository";
import type {
  CouponValidationResult,
  DigitalCheckoutInput,
  DigitalCoupon,
  DigitalOrderContext,
  DigitalPlacedOrder,
} from "../types/digitalOrdering.types";
import { DIGITAL_ORDER_MODE_LABELS } from "../types/digitalOrdering.types";
import { notifyDesktopNewDigitalOrder } from "../integrations/desktop.adapter";
import { emitDigitalOrderAutomation } from "../integrations/automation.adapter";

const DEMO_COUPONS: DigitalCoupon[] = [
  { code: "COSMO10", type: "percent", value: 10, label: "10% off" },
  { code: "BEMVINDO", type: "fixed", value: 5, label: "R$ 5 off" },
];

function formatDeliveryAddressForObservation(
  address: DigitalOrderContext["deliveryAddress"]
): string | null {
  if (address == null) return null;
  if (typeof address === "string") {
    const trimmed = address.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const bits = [
    address.street,
    address.number ? `nº ${address.number}` : null,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(" - "),
    address.cep ? `CEP ${address.cep}` : null,
    address.reference ? `Ref: ${address.reference}` : null,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return bits.length > 0 ? bits.join(", ") : null;
}

function buildContextObservation(context: DigitalOrderContext) {
  const parts = [`Pedido Digital — ${DIGITAL_ORDER_MODE_LABELS[context.mode]}`];

  if (context.tableLabel) parts.push(`Mesa: ${context.tableLabel}`);
  if (context.customerName) parts.push(`Cliente: ${context.customerName}`);
  if (context.customerPhone) parts.push(`Tel: ${context.customerPhone}`);
  const addressLine = formatDeliveryAddressForObservation(context.deliveryAddress);
  if (addressLine) parts.push(`Endereço: ${addressLine}`);

  return parts.join(" | ");
}

function mergeObservations(cartObservation: string, context: DigitalOrderContext) {
  return [buildContextObservation(context), cartObservation.trim()]
    .filter(Boolean)
    .join("\n");
}

function mapCartItemsToRpc(items: CartItem[]) {
  return items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    options: item.selectedOptions.map((option) => ({
      option_id: option.optionId,
      quantity: option.quantity ?? 1,
    })),
    ...(item.comboComponents && item.comboComponents.length > 0
      ? {
          components: mapCartUnitsToRpcComponents(item.comboComponents),
        }
      : {}),
  }));
}

export const digitalOrderingService = {
  /**
   * Cupons públicos desativados até validação server-side.
   * Mantém a API para a UI futura; nunca aplica desconto no checkout.
   */
  validateCoupon(_code: string, _subtotal: number): CouponValidationResult {
    void _code;
    void _subtotal;
    void DEMO_COUPONS;
    return {
      valid: false,
      error: "Cupons promocionais estarão disponíveis em breve.",
    };
  },

  calculateTotal(subtotal: number, discount: number, deliveryFee: number) {
    const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
    return Math.max(subtotal - safeDiscount + deliveryFee, 0);
  },

  async placeOrder(input: DigitalCheckoutInput) {
    const observation = mergeObservations(input.observation ?? "", input.context);

    // Sem cupom server-side: nunca envia desconto; paymentAmount = total UI.
    const result = await placePublicDigitalOrder({
      storeSlug: input.storeSlug,
      items: mapCartItemsToRpc(input.items),
      paymentMethod: input.paymentMethod,
      paymentAmount: Number(input.paymentAmount),
      discount: 0,
      observation,
      context: input.context as unknown as Record<string, unknown>,
    });

    const placed: DigitalPlacedOrder = {
      id: result.id,
      saleNumber: result.sale_number,
      organizationId: input.organizationId,
      storeSlug: input.storeSlug,
      context: input.context,
      total: Number(result.total),
      estimatedMinutes: result.estimated_minutes ?? 20,
      status: "received",
      createdAt: new Date().toISOString(),
      readyNotified: false,
    };

    saveLocalDigitalOrder(placed);
    emitDigitalOrderAutomation(placed, input.paymentMethod);
    notifyDesktopNewDigitalOrder(placed);

    return { result, order: placed };
  },

  async getOrderStatus(
    orderId: string,
    organizationId?: string | null,
    storeSlug?: string | null
  ) {
    const publicStatus =
      storeSlug != null
        ? await fetchPublicOrderStatus(storeSlug, orderId).catch(() => null)
        : null;

    const ticket =
      publicStatus == null
        ? await fetchKitchenTicketStatusBySaleId(orderId).catch(() => null)
        : null;

    const sale = await fetchSaleSummary(orderId).catch(() => null);

    const local =
      organizationId != null
        ? findLocalDigitalOrder(organizationId, orderId)
        : null;

    if (!publicStatus && !ticket && !sale && !local) {
      return null;
    }

    const status =
      publicStatus?.status ?? ticket?.status ?? local?.status ?? "received";
    const estimatedMinutes =
      publicStatus?.estimatedMinutes ??
      ticket?.estimatedMinutes ??
      local?.estimatedMinutes ??
      20;

    if (organizationId) {
      updateLocalDigitalOrderStatus(organizationId, orderId, status);
    }

    return {
      id: orderId,
      saleNumber:
        publicStatus?.saleNumber ??
        ticket?.saleNumber ??
        sale?.sale_number ??
        local?.saleNumber ??
        0,
      status,
      estimatedMinutes,
      total: Number(publicStatus?.total ?? sale?.total ?? local?.total ?? 0),
      updatedAt:
        publicStatus?.updatedAt ??
        ticket?.updatedAt ??
        local?.createdAt ??
        new Date().toISOString(),
      context: local?.context ?? null,
      readyNotified: local?.readyNotified ?? false,
    };
  },

  markReadyNotified(organizationId: string, orderId: string) {
    const current = findLocalDigitalOrder(organizationId, orderId);
    if (!current) return;
    updateLocalDigitalOrderStatus(
      organizationId,
      orderId,
      current.status,
      true
    );
  },

  mapCartToCheckout(items: CartItem[]) {
    return items;
  },
};

export function buildMinimumOrderError(minimum: number) {
  return `Pedido mínimo de R$ ${minimum.toFixed(2).replace(".", ",")}.`;
}

export function isPaymentMethodReady(method: PaymentMethod) {
  return method === "pix" || method === "cash";
}
