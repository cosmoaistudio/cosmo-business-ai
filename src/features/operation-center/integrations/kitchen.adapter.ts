import type { KitchenTicket } from "@/features/kitchen-display/types/kitchenDisplay.types";
import { buildKitchenMetrics } from "@/features/kitchen-display/utils/kitchenMetrics";
import type { RealtimeMetrics } from "../types/operationCenter";

const DEFAULT_MAX_PREP = 25;

export function buildRealtimeMetrics(tickets: KitchenTicket[]): RealtimeMetrics {
  const metrics = buildKitchenMetrics(tickets, DEFAULT_MAX_PREP);

  return {
    ordersWaiting: metrics.queueCount,
    ordersPreparing: metrics.preparingCount,
    ordersReady: metrics.readyCount,
    ordersOverdue: metrics.overdueCount,
    averagePrepMinutes: metrics.averagePrepMinutes,
    kitchenQueueSize: metrics.queueCount + metrics.preparingCount,
  };
}

export function mapKitchenTicketsToDeliveryCount(tickets: KitchenTicket[]) {
  return tickets.filter(
    (ticket) =>
      ticket.ticketType === "delivery" && ticket.status !== "delivered"
  ).length;
}
