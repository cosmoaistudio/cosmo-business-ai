import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function extractKitchenSignals(ctx: CosmoAiAnalysisContext) {
  return {
    queueSize: ctx.realtime.kitchenQueueSize,
    averagePrepMinutes: ctx.realtime.averagePrepMinutes,
    ordersWaiting: ctx.realtime.ordersWaiting,
    ordersPreparing: ctx.realtime.ordersPreparing,
    ordersReady: ctx.realtime.ordersReady,
    ordersOverdue: ctx.realtime.ordersOverdue,
    ticketCount: ctx.operation.kitchenTickets.length,
  };
}
