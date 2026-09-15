import type { CartItem } from "@/features/pdv/types/cart";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalOrderMode } from "./digitalStore.types";

export type DigitalOrderStatusStep =
  | "received"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered";

export interface DigitalCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label: string;
}

export interface DigitalOrderContext {
  mode: DigitalOrderMode;
  tableId?: string;
  tableLabel?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
}

export interface DigitalPlacedOrder {
  id: string;
  saleNumber: number;
  organizationId: string;
  storeSlug: string;
  context: DigitalOrderContext;
  total: number;
  estimatedMinutes: number;
  status: DigitalOrderStatusStep;
  createdAt: string;
  readyNotified: boolean;
}

export interface DigitalCheckoutInput {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  discount: number;
  couponCode?: string | null;
  observation?: string;
  customerId?: string | null;
  organizationId: string;
  storeSlug: string;
  context: DigitalOrderContext;
}

export interface DigitalMenuSession {
  storeSlug: string;
  organizationId: string;
  context: DigitalOrderContext;
}

export const DIGITAL_ORDER_STATUS_LABELS: Record<DigitalOrderStatusStep, string> = {
  received: "Recebido",
  accepted: "Aceito",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
};

export const DIGITAL_ORDER_MODE_LABELS: Record<DigitalOrderMode, string> = {
  dine_in: "Mesa",
  pickup: "Retirada",
  delivery: "Delivery",
  event: "Evento",
};
