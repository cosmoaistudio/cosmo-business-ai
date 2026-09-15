import type { OperationCenterData } from "../types/operationCenter";

export function toDashboardSnapshot(data: OperationCenterData) {
  return {
    salesToday: data.metrics.salesTodayTotal,
    salesCount: data.metrics.salesTodayCount,
    healthScore: data.health.overall,
    ordersWaiting: data.realtime.ordersWaiting,
    alertsCritical: data.summary.critical,
  };
}

export function toDashboardHealthCards(data: OperationCenterData) {
  return [
    { label: "Pedidos", value: data.health.orders },
    { label: "Estoque", value: data.health.stock },
    { label: "Financeiro", value: data.health.finance },
  ];
}
