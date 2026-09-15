import type { OperationCenterData } from "@/features/operation-center/types/operationCenter";
import type { CosmoAiAnalysisContext } from "../types/analysisContext";

export function toOperationCenterSnapshot(data: OperationCenterData) {
  return {
    healthOverall: data.health.overall,
    alertCount: data.alerts.length,
    criticalCount: data.summary.critical,
    kitchenQueue: data.realtime.kitchenQueueSize,
    ordersOverdue: data.realtime.ordersOverdue,
    desktopOnline: data.connectivity.desktopOnline,
  };
}

export function mergeOperationSignals(context: CosmoAiAnalysisContext) {
  return {
    kitchenQueue: context.realtime.kitchenQueueSize,
    ordersWaiting: context.realtime.ordersWaiting,
    ordersPreparing: context.realtime.ordersPreparing,
    desktopOnline: context.connectivity.desktopOnline,
    cashiersOnline: context.connectivity.cashiersOnline,
  };
}
