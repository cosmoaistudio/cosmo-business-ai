import type {
  ConnectivityStatus,
  OperationalSector,
  OperationStatusLevel,
  RealtimeMetrics,
} from "../types/operationCenter";
import type { OperationCenterRawData } from "../repository/operationCenter.repository";

function levelFromRatio(ratio: number): OperationStatusLevel {
  if (ratio >= 0.7) return "critical";
  if (ratio >= 0.35) return "attention";
  return "normal";
}

function levelFromCount(count: number, warn: number, critical: number): OperationStatusLevel {
  if (count >= critical) return "critical";
  if (count >= warn) return "attention";
  return "normal";
}

export function buildOperationalSectors(input: {
  raw: OperationCenterRawData;
  realtime: RealtimeMetrics;
  connectivity: ConnectivityStatus;
}): OperationalSector[] {
  const { raw, realtime, connectivity } = input;

  const kitchenStatus = levelFromCount(
    realtime.ordersOverdue,
    1,
    3
  );
  if (realtime.kitchenQueueSize >= 8) {
    // override to at least attention
  }
  const kitchenFinal: OperationStatusLevel =
    realtime.kitchenQueueSize >= 12 || realtime.ordersOverdue >= 3
      ? "critical"
      : realtime.kitchenQueueSize >= 6 || realtime.ordersOverdue >= 1
        ? "attention"
        : kitchenStatus;

  const desktopRatio =
    connectivity.desktopTotal > 0
      ? 1 - connectivity.desktopOnline / connectivity.desktopTotal
      : 1;

  const stockCritical =
    raw.products.filter((p) => p.stock === 0).length +
    raw.stockAlerts.filter((a) => a.severity === "warning").length;

  const deliveryTickets = raw.kitchenTickets.filter(
    (t) =>
      t.ticketType === "delivery" &&
      t.status !== "delivered"
  ).length;

  return [
    {
      id: "kitchen",
      label: "Cozinha",
      status: kitchenFinal,
      metric: `${realtime.kitchenQueueSize} na fila`,
      detail: `${realtime.ordersPreparing} preparando · ${realtime.ordersReady} prontos`,
    },
    {
      id: "pdv",
      label: "PDV / Caixa",
      status: levelFromCount(connectivity.cashiersOnline, 0, 0) === "normal" && connectivity.cashiersOnline === 0
        ? "attention"
        : "normal",
      metric: `${connectivity.cashiersOnline} caixa(s)`,
      detail: `${raw.salesTodayCount} vendas hoje`,
    },
    {
      id: "delivery",
      label: "Delivery",
      status: levelFromCount(deliveryTickets, 3, 8),
      metric: `${deliveryTickets} em rota`,
      detail: `${connectivity.deliveryOnline} entregador(es) online`,
    },
    {
      id: "inventory",
      label: "Estoque",
      status: levelFromCount(stockCritical, 2, 5),
      metric: `${stockCritical} alerta(s)`,
      detail: `${raw.products.filter((p) => p.status === "inactive").length} pausados`,
    },
    {
      id: "desktop",
      label: "Desktop",
      status: levelFromRatio(desktopRatio),
      metric: `${connectivity.desktopOnline}/${connectivity.desktopTotal}`,
      detail: connectivity.realtimeConnected ? "Realtime OK" : "Realtime instável",
    },
    {
      id: "finance",
      label: "Financeiro",
      status:
        raw.salesTodayTotal > 0
          ? "normal"
          : "attention",
      metric: raw.salesTodayTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      detail: "Faturamento do dia",
    },
  ];
}
