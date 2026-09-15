import type { KitchenMetrics, KitchenTicket } from "../types/kitchenDisplay.types";
import { computeAveragePrepMinutes, isTicketOverdue } from "./kitchenTime";

export function buildKitchenMetrics(
  tickets: KitchenTicket[],
  maxPrepMinutes: number
): KitchenMetrics {
  return {
    averagePrepMinutes: computeAveragePrepMinutes(tickets),
    overdueCount: tickets.filter((ticket) =>
      isTicketOverdue(ticket, maxPrepMinutes)
    ).length,
    preparingCount: tickets.filter((ticket) => ticket.status === "preparing").length,
    readyCount: tickets.filter((ticket) => ticket.status === "ready").length,
    queueCount: tickets.filter(
      (ticket) => ticket.status === "pending" || ticket.status === "accepted"
    ).length,
  };
}
