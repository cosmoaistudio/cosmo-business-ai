import { emitAutomationEvent } from "@/lib/automation-events";
import type { KitchenStatus, KitchenTicket } from "../types/kitchenDisplay.types";

const STATUS_TO_EVENT: Partial<Record<KitchenStatus, "ORDER_CREATED" | "ORDER_COMPLETED">> = {
  accepted: "ORDER_CREATED",
  ready: "ORDER_CREATED",
  delivered: "ORDER_COMPLETED",
};

export function emitKitchenAutomationEvent(
  status: KitchenStatus,
  ticket: KitchenTicket
) {
  const eventType = STATUS_TO_EVENT[status];
  if (!eventType) return;

  emitAutomationEvent(eventType, {
    module: "kitchen-display",
    saleId: ticket.saleId,
    saleNumber: ticket.saleNumber,
    status,
    serviceType: ticket.ticketType,
    entityId: ticket.id,
    entityType: "kitchen_ticket",
  });
}
