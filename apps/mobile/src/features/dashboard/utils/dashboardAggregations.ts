import type {
  DashboardAlert,
  DashboardHealth,
  DashboardMetrics,
  DashboardProductRow,
  DashboardRawData,
  DashboardRecentSale,
  DashboardRemoteCommandRow,
  DashboardSaleRow,
  MobileDashboardSnapshot,
} from "../types/dashboard.types";
import { isToday } from "./dashboard.utils";

const DELAYED_ORDER_MS = 15 * 60 * 1000;
const RECENT_SALES_LIMIT = 8;
const RECENT_ALERTS_LIMIT = 10;

function computeCriticalStockCount(products: DashboardProductRow[]) {
  return products.filter(
    (product) =>
      product.status === "active" &&
      product.min_stock > 0 &&
      product.stock <= product.min_stock
  ).length;
}

function countDelayedOrders(commands: DashboardRemoteCommandRow[]) {
  const threshold = Date.now() - DELAYED_ORDER_MS;
  return commands.filter(
    (command) => new Date(command.created_at).getTime() < threshold
  ).length;
}

function buildAlerts(data: DashboardRawData): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  for (const product of data.products.filter((item) => item.status === "inactive")) {
    alerts.push({
      id: `paused-product-${product.id}`,
      type: "paused_product",
      title: product.name,
      description: "Produto pausado e indisponível no PDV",
      severity: "warning",
    });
  }

  for (const option of data.options.filter((item) => !item.active)) {
    alerts.push({
      id: `paused-option-${option.id}`,
      type: "paused_option",
      title: option.name,
      description: "Adicional pausado",
      severity: "warning",
    });
  }

  for (const product of data.products.filter((item) => item.stock === 0)) {
    alerts.push({
      id: `stock-out-${product.id}`,
      type: "stock_out",
      title: product.name,
      description: "Produto com estoque zerado",
      severity: "critical",
    });
  }

  for (const product of data.products.filter(
    (item) =>
      item.status === "active" &&
      item.min_stock > 0 &&
      item.stock > 0 &&
      item.stock <= item.min_stock
  )) {
    alerts.push({
      id: `stock-critical-${product.id}`,
      type: "stock_critical",
      title: product.name,
      description: `Estoque ${product.stock} (mínimo ${product.min_stock})`,
      severity: "warning",
    });
  }

  const delayedThreshold = Date.now() - DELAYED_ORDER_MS;
  for (const command of data.pendingCommands.filter(
    (item) => new Date(item.created_at).getTime() < delayedThreshold
  )) {
    alerts.push({
      id: `order-overdue-${command.id}`,
      type: "order_overdue",
      title: `Comando ${command.command}`,
      description: "Pedido/comando pendente acima do tempo esperado",
      severity: "critical",
      timestamp: command.created_at,
    });
  }

  for (const log of data.automationLogsToday.filter((item) => item.status === "failed")) {
    alerts.push({
      id: `automation-failed-${log.id}`,
      type: "automation_failed",
      title: log.automation_rules?.name ?? "Automação",
      description: log.error_message ?? "Falha na execução",
      severity: "critical",
      timestamp: log.created_at,
    });
  }

  for (const agent of data.desktopAgents.filter((item) => item.status !== "online")) {
    alerts.push({
      id: `desktop-offline-${agent.id}`,
      type: "desktop_offline",
      title: agent.device_name,
      description: "Terminal desktop offline",
      severity: "warning",
      timestamp: agent.last_seen_at,
    });
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };

  return alerts
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, RECENT_ALERTS_LIMIT);
}

function buildHealth(metrics: DashboardMetrics): DashboardHealth {
  let score = 100;

  if (metrics.desktopTotal > 0 && metrics.desktopOnline === 0) score -= 35;
  if (metrics.delayedOrders > 0) score -= 20;
  if (metrics.criticalStockCount > 0) {
    score -= Math.min(25, metrics.criticalStockCount * 5);
  }
  if (metrics.openOrders > 5) score -= 10;
  if (metrics.pausedProducts > 0) score -= Math.min(10, metrics.pausedProducts * 2);
  if (metrics.pausedOptions > 0) score -= Math.min(10, metrics.pausedOptions * 2);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score >= 80 ? "healthy" : score >= 55 ? "attention" : "critical",
  };
}

function mapRecentSales(sales: DashboardSaleRow[]): DashboardRecentSale[] {
  return sales.slice(0, RECENT_SALES_LIMIT).map((sale) => ({
    id: sale.id,
    saleNumber: sale.sale_number,
    total: Number(sale.total),
    createdAt: sale.created_at,
  }));
}

export function buildDashboardSnapshot(data: DashboardRawData): MobileDashboardSnapshot {
  const revenueToday = data.salesToday.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  );

  const desktopOnline = data.desktopAgents.filter(
    (agent) => agent.status === "online"
  ).length;

  const metrics: DashboardMetrics = {
    revenueToday,
    openOrders: data.pendingCommands.length,
    delayedOrders: countDelayedOrders(data.pendingCommands),
    criticalStockCount: computeCriticalStockCount(data.products),
    automationsExecutedToday: data.automationLogsToday.filter(
      (log) => log.status === "success" && isToday(log.created_at)
    ).length,
    desktopOnline,
    desktopTotal: data.desktopAgents.length,
    pausedProducts: data.products.filter((item) => item.status === "inactive").length,
    pausedOptions: data.options.filter((item) => !item.active).length,
  };

  return {
    organizationId: data.organizationId,
    metrics,
    health: buildHealth(metrics),
    desktopAgents: data.desktopAgents,
    recentSales: mapRecentSales(data.recentSales),
    alerts: buildAlerts(data),
    checkedAt: new Date().toISOString(),
  };
}
