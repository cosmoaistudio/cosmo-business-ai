import { emitAutomationEvent } from "@/lib/automation-events";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalPlacedOrder } from "../types/digitalOrdering.types";

export function emitDigitalOrderAutomation(
  order: DigitalPlacedOrder,
  paymentMethod: PaymentMethod
) {
  emitAutomationEvent("SALE_COMPLETED", {
    module: "orders",
    saleId: order.id,
    saleNumber: order.saleNumber,
    source: "system",
    mode: order.context.mode,
    paymentMethod,
  });

  emitAutomationEvent("ORDER_CREATED", {
    module: "orders",
    orderId: order.id,
    saleNumber: order.saleNumber,
    source: "system",
    mode: order.context.mode,
  });
}
