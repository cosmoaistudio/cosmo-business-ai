import type { KitchenTicket } from "../types/kitchenDisplay.types";
import { buildKitchenMetrics } from "../utils/kitchenMetrics";

export interface MobileKitchenSnapshot {
  metrics: ReturnType<typeof buildKitchenMetrics>;
  activeTickets: number;
  tickets: Array<Pick<KitchenTicket, "id" | "saleNumber" | "status" | "ticketType">>;
}

export function buildMobileKitchenSnapshot(
  tickets: KitchenTicket[],
  maxPrepMinutes: number
): MobileKitchenSnapshot {
  const active = tickets.filter((ticket) => ticket.status !== "delivered");

  return {
    metrics: buildKitchenMetrics(tickets, maxPrepMinutes),
    activeTickets: active.length,
    tickets: active.map((ticket) => ({
      id: ticket.id,
      saleNumber: ticket.saleNumber,
      status: ticket.status,
      ticketType: ticket.ticketType,
    })),
  };
}
