import type {
  CriticalAlert,
  ConnectivityStatus,
  HealthScoreBreakdown,
  OperationCenterData,
  OperationCenterFilters,
  OperationMetrics,
  OperationRecommendation,
  OperationSummary,
  RealtimeMetrics,
  TimelineEvent,
} from "../types/operationCenter";
import type { OperationCenterRawData } from "../repository/operationCenter.repository";
import type { CompositionOption } from "@/features/product-composition/types/option";
import { isToday, isWithinPeriod } from "./periodUtils";
import { buildRealtimeMetrics } from "../integrations/kitchen.adapter";
import {
  buildConnectivityStatus,
  buildDesktopTimelineEvents,
} from "../integrations/desktop.adapter";
import { buildOperationalSectors } from "./sectorStatus";
import { countUnavailableProducts } from "../integrations/productEngine.adapter";

function countPausedGroups(options: OperationCenterRawData["options"]) {
  const byGroup = new Map<string, CompositionOption[]>();

  for (const option of options) {
    const groupOptions = byGroup.get(option.group_id) ?? [];
    groupOptions.push(option);
    byGroup.set(option.group_id, groupOptions);
  }

  let pausedGroups = 0;

  for (const groupOptions of byGroup.values()) {
    if (
      groupOptions.length > 0 &&
      groupOptions.every((option) => !option.active)
    ) {
      pausedGroups += 1;
    }
  }

  return pausedGroups;
}

function buildCriticalAlerts(
  data: OperationCenterRawData,
  realtime: RealtimeMetrics,
  connectivity: ConnectivityStatus
): CriticalAlert[] {
  const alerts: CriticalAlert[] = [];

  for (const product of data.products.filter((item) => item.status === "inactive")) {
    alerts.push({
      id: `paused-product-${product.id}`,
      type: "paused_product",
      title: product.name,
      description: "Produto pausado e indisponível no PDV",
      severity: "warning",
      href: `/produtos/builder/${product.id}`,
    });
  }

  for (const product of data.products.filter(
    (item) => item.status === "active" && item.stock <= 0
  )) {
    alerts.push({
      id: `unavailable-${product.id}`,
      type: "product_unavailable",
      title: product.name,
      description: "Produto indisponível para venda",
      severity: "critical",
      href: "/produtos",
    });
  }

  for (const option of data.options.filter((item) => !item.active)) {
    alerts.push({
      id: `paused-option-${option.id}`,
      type: "paused_option",
      title: option.name,
      description: "Adicional pausado",
      severity: "warning",
      href: "/opcoes/itens",
    });
  }

  for (const product of data.products.filter((item) => item.stock === 0)) {
    alerts.push({
      id: `stock-out-product-${product.id}`,
      type: "stock_out",
      title: product.name,
      description: "Produto com estoque zerado",
      severity: "critical",
      href: "/estoque",
    });
  }

  for (const alert of data.stockAlerts.filter(
    (item) => item.severity === "warning" && item.currentStock > 0
  )) {
    alerts.push({
      id: `stock-critical-${alert.productId}`,
      type: "stock_critical",
      title: alert.productName,
      description: `Estoque ${alert.currentStock} (mínimo ${alert.minStock})`,
      severity: "warning",
      href: "/estoque",
    });

    alerts.push({
      id: `stock-low-${alert.productId}`,
      type: "stock_low",
      title: alert.productName,
      description: "Estoque abaixo do mínimo",
      severity: "warning",
      href: "/estoque",
    });
  }

  if (realtime.ordersOverdue > 0) {
    alerts.push({
      id: "order-overdue",
      type: "order_overdue",
      title: "Pedidos atrasados",
      description: `${realtime.ordersOverdue} pedido(s) acima do SLA`,
      severity: "critical",
      href: "/cozinha",
    });
  }

  if (realtime.kitchenQueueSize >= 8) {
    alerts.push({
      id: "large-queue",
      type: "large_queue",
      title: "Fila grande na cozinha",
      description: `${realtime.kitchenQueueSize} pedidos na fila`,
      severity: realtime.kitchenQueueSize >= 12 ? "critical" : "warning",
      href: "/pedidos",
    });
  }

  if (
    realtime.ordersWaiting > 0 &&
    realtime.ordersPreparing === 0 &&
    realtime.ordersReady === 0
  ) {
    alerts.push({
      id: "kitchen-stalled",
      type: "kitchen_stalled",
      title: "Kitchen parada",
      description: `${realtime.ordersWaiting} pedido(s) aguardando aceite`,
      severity: "critical",
      href: "/cozinha",
    });
  }

  if (
    connectivity.desktopTotal > 0 &&
    connectivity.desktopOnline === 0
  ) {
    alerts.push({
      id: "desktop-offline",
      type: "desktop_offline",
      title: "Desktop offline",
      description: "Nenhum agente desktop conectado",
      severity: "critical",
      href: "/configuracoes",
    });
  }

  for (const log of data.automationLogs.filter((item) => item.status === "failed")) {
    alerts.push({
      id: `automation-failed-${log.id}`,
      type: "automation_failed",
      title: log.automation_rules?.name ?? "Automação",
      description: log.error_message ?? "Falha na execução",
      severity: "critical",
      href: "/automacoes",
      timestamp: log.created_at,
    });
  }

  const unavailableCount = countUnavailableProducts(data.products);
  if (unavailableCount >= 3) {
    alerts.push({
      id: "products-unavailable-batch",
      type: "product_unavailable",
      title: "Produtos indisponíveis",
      description: `${unavailableCount} produto(s) fora de operação`,
      severity: "warning",
      href: "/produtos",
    });
  }

  if (data.salesTodayCount > 0) {
    alerts.push({
      id: "cash-open",
      type: "cash_open",
      title: "Caixa em operação",
      description: `${data.salesTodayCount} venda(s) registrada(s) hoje`,
      severity: "info",
      href: "/pdv",
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function buildSummary(alerts: CriticalAlert[]): OperationSummary {
  return {
    critical: alerts.filter((alert) => alert.severity === "critical").length,
    attention: alerts.filter((alert) => alert.severity === "warning").length,
    normal: alerts.filter((alert) => alert.severity === "info").length,
  };
}

function buildMetrics(
  data: OperationCenterRawData,
  realtime: RealtimeMetrics
): OperationMetrics {
  const automationsToday = data.automationLogs.filter((log) =>
    isToday(log.created_at)
  );

  const customersWithoutPurchases = data.customers.filter(
    (customer) => !data.customerIdsWithSales.has(customer.id)
  ).length;

  return {
    activeProducts: data.products.filter((item) => item.status === "active").length,
    pausedProducts: data.products.filter((item) => item.status === "inactive")
      .length,
    pausedGroups: countPausedGroups(data.options),
    waitingCustomers: customersWithoutPurchases,
    ordersInPrep: realtime.ordersPreparing,
    overdueOrders: realtime.ordersOverdue,
    automationsToday: automationsToday.length,
    failuresToday: automationsToday.filter((log) => log.status === "failed")
      .length,
    salesTodayTotal: data.salesTodayTotal,
    salesTodayCount: data.salesTodayCount,
  };
}

function buildTimeline(
  data: OperationCenterRawData,
  period: OperationCenterFilters["period"]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const sale of data.sales) {
    if (!isWithinPeriod(sale.created_at, period)) continue;

    events.push({
      id: `sale-${sale.id}`,
      timestamp: sale.created_at,
      label: "Venda realizada",
      description: `#${sale.sale_number} · ${Number(sale.total).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
      type: "sale",
    });
  }

  for (const ticket of data.kitchenTickets.filter(
    (t) => t.status === "delivered" && t.completedAt
  )) {
    if (!isWithinPeriod(ticket.completedAt!, period)) continue;

    events.push({
      id: `delivered-${ticket.id}`,
      timestamp: ticket.completedAt!,
      label: "Pedido entregue",
      description: `Pedido #${ticket.saleNumber}`,
      type: "order_delivered",
    });
  }

  for (const product of data.products) {
    if (product.status === "inactive" && product.updated_at && isWithinPeriod(product.updated_at, period)) {
      events.push({
        id: `paused-${product.id}`,
        timestamp: product.updated_at,
        label: "Produto pausado",
        description: product.name,
        type: "product_paused",
      });
    }
    if (product.status === "active" && product.updated_at && isWithinPeriod(product.updated_at, period)) {
      events.push({
        id: `activated-${product.id}-${product.updated_at}`,
        timestamp: product.updated_at,
        label: "Produto reativado",
        description: product.name,
        type: "product_activated",
      });
    }
  }

  for (const movement of data.movements) {
    if (!isWithinPeriod(movement.created_at, period)) continue;

    const isCritical =
      movement.movement_type === "exit" && movement.new_stock <= 5;

    events.push({
      id: `movement-${movement.id}`,
      timestamp: movement.created_at,
      label: isCritical ? "Estoque crítico" : "Estoque atualizado",
      description: `${movement.products?.name ?? "Produto"} · ${movement.quantity} un.`,
      type: isCritical ? "stock_critical" : "stock",
    });
  }

  for (const cmd of data.remoteCommands.filter((c) =>
    c.command.includes("PRINT")
  )) {
    if (!isWithinPeriod(cmd.created_at, period)) continue;
    events.push({
      id: `print-${cmd.id}`,
      timestamp: cmd.created_at,
      label: "Impressão enviada",
      description: `Comando ${cmd.command} · ${cmd.status}`,
      type: "print_sent",
    });
  }

  events.push(...buildDesktopTimelineEvents(data.desktopAgents));

  for (const log of data.automationLogs) {
    if (!isWithinPeriod(log.created_at, period)) continue;

    events.push({
      id: `automation-${log.id}`,
      timestamp: log.created_at,
      label:
        log.status === "failed"
          ? `Automação falhou · ${log.automation_rules?.name ?? "Regra"}`
          : `Automação executada · ${log.automation_rules?.name ?? "Regra"}`,
      description: log.error_message ?? "Execução registrada",
      type: "automation",
    });
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 60);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHealthScore(
  data: OperationCenterRawData,
  alerts: CriticalAlert[],
  metrics: OperationMetrics,
  realtime: RealtimeMetrics,
  connectivity: ConnectivityStatus
): HealthScoreBreakdown {
  const totalProducts = data.products.length || 1;
  const criticalStock =
    alerts.filter((a) => a.type === "stock_out" || a.type === "stock_critical")
      .length;

  const stockScore = clampScore(100 - (criticalStock / totalProducts) * 100);

  const financeScore = clampScore(
    data.salesTodayTotal > 0 ? 80 + Math.min(data.salesTodayTotal / 200, 20) : 50
  );

  const ordersScore = clampScore(
    100 -
      realtime.ordersOverdue * 15 -
      Math.max(0, realtime.kitchenQueueSize - 4) * 3
  );

  const kitchenScore = clampScore(
    100 -
      realtime.ordersOverdue * 20 -
      (realtime.ordersPreparing === 0 && realtime.ordersWaiting > 2 ? 25 : 0)
  );

  const desktopScore = clampScore(
    connectivity.desktopTotal > 0
      ? (connectivity.desktopOnline / connectivity.desktopTotal) * 100
      : 60
  );

  const realtimeScore = clampScore(connectivity.realtimeConnected ? 95 : 45);

  const automationTotal = metrics.automationsToday || 1;
  const automationScore = clampScore(
    100 - (metrics.failuresToday / automationTotal) * 100
  );

  const overall = clampScore(
    ordersScore * 0.2 +
      stockScore * 0.15 +
      kitchenScore * 0.2 +
      desktopScore * 0.15 +
      realtimeScore * 0.1 +
      financeScore * 0.1 +
      automationScore * 0.1
  );

  return {
    overall,
    orders: ordersScore,
    stock: stockScore,
    desktop: desktopScore,
    kitchen: kitchenScore,
    realtime: realtimeScore,
    finance: financeScore,
    automations: automationScore,
  };
}

function buildRecommendations(
  alerts: CriticalAlert[],
  data: OperationCenterRawData
): OperationRecommendation[] {
  const recommendations: OperationRecommendation[] = [];

  for (const alert of alerts) {
    if (
      alert.type === "stock_critical" ||
      alert.type === "stock_out" ||
      alert.type === "stock_low"
    ) {
      recommendations.push({
        id: `rec-restock-${alert.id}`,
        type: "restock",
        title: "Repor estoque",
        description: alert.title,
        actionLabel: "Ir para estoque",
        href: "/estoque",
        priority: alert.severity === "critical" ? "high" : "medium",
      });
    }

    if (
      alert.type === "order_overdue" ||
      alert.type === "kitchen_stalled" ||
      alert.type === "large_queue"
    ) {
      recommendations.push({
        id: `rec-kitchen-${alert.id}`,
        type: "kitchen",
        title: alert.title,
        description: alert.description,
        actionLabel: "Abrir cozinha",
        href: "/cozinha",
        priority: "high",
      });
    }

    if (alert.type === "automation_failed") {
      recommendations.push({
        id: `rec-automation-${alert.id}`,
        type: "automation_log",
        title: "Automação falhou",
        description: alert.description,
        actionLabel: "Ver log",
        href: "/automacoes",
        priority: "high",
      });
    }
  }

  if (data.customersWithoutRecentActivity.length > 0) {
    recommendations.push({
      id: "rec-campaign",
      type: "campaign",
      title: "Clientes inativos",
      description: `${data.customersWithoutRecentActivity.length} cliente(s) sem compras recentes`,
      actionLabel: "Ver clientes",
      href: "/clientes",
      priority: "low",
    });
  }

  return recommendations
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 8);
}

export function buildOperationCenterData(
  data: OperationCenterRawData,
  filters: OperationCenterFilters,
  options: { realtimeConnected?: boolean; liveTimeline?: TimelineEvent[] } = {}
): OperationCenterData {
  const realtime = buildRealtimeMetrics(data.kitchenTickets);
  const connectivity = buildConnectivityStatus({
    agents: data.desktopAgents,
    cashSessions: data.cashSessions,
    realtimeConnected: options.realtimeConnected ?? true,
  });

  const alerts = buildCriticalAlerts(data, realtime, connectivity);
  const metrics = buildMetrics(data, realtime);
  const summary = buildSummary(alerts);
  const timeline = buildTimeline(data, filters.period);
  const health = buildHealthScore(data, alerts, metrics, realtime, connectivity);
  const recommendations = buildRecommendations(alerts, data);
  const sectors = buildOperationalSectors({ raw: data, realtime, connectivity });

  const liveTimeline = [
    ...(options.liveTimeline ?? []),
    ...timeline.filter((event) => isToday(event.timestamp)).slice(0, 15),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 25);

  return {
    summary,
    alerts,
    metrics,
    realtime,
    connectivity,
    sectors,
    timeline,
    liveTimeline,
    health,
    recommendations,
    lastUpdated: new Date().toISOString(),
  };
}
