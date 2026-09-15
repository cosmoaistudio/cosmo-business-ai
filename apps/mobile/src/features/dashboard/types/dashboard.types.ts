import type { DesktopAgentRecord } from "@cosmo/remote-commands";

export type DashboardHealthLabel = "healthy" | "attention" | "critical";

export type DashboardAlertSeverity = "critical" | "warning" | "info";

export type DashboardAlertType =
  | "paused_product"
  | "paused_option"
  | "stock_out"
  | "stock_critical"
  | "order_overdue"
  | "order_open"
  | "automation_failed"
  | "desktop_offline";

export interface DashboardProductRow {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  status: string;
}

export interface DashboardOptionRow {
  id: string;
  name: string;
  active: boolean;
  group_id: string;
  stock: number;
  stock_control: boolean;
}

export interface DashboardSaleRow {
  id: string;
  sale_number: number;
  total: number;
  created_at: string;
  status: string;
}

export interface DashboardRemoteCommandRow {
  id: string;
  status: string;
  created_at: string;
  command: string;
}

export interface DashboardAutomationLogRow {
  id: string;
  status: string;
  created_at: string;
  error_message: string | null;
  automation_rules?: { id: string; name: string } | null;
}

export interface DashboardRawData {
  organizationId: string;
  salesToday: DashboardSaleRow[];
  recentSales: DashboardSaleRow[];
  products: DashboardProductRow[];
  options: DashboardOptionRow[];
  pendingCommands: DashboardRemoteCommandRow[];
  automationLogsToday: DashboardAutomationLogRow[];
  desktopAgents: DesktopAgentRecord[];
}

export interface DashboardMetrics {
  revenueToday: number;
  openOrders: number;
  delayedOrders: number;
  criticalStockCount: number;
  automationsExecutedToday: number;
  desktopOnline: number;
  desktopTotal: number;
  pausedProducts: number;
  pausedOptions: number;
}

export interface DashboardHealth {
  score: number;
  label: DashboardHealthLabel;
}

export interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  title: string;
  description: string;
  severity: DashboardAlertSeverity;
  timestamp?: string;
}

export interface DashboardRecentSale {
  id: string;
  saleNumber: number;
  total: number;
  createdAt: string;
}

export interface MobileDashboardSnapshot {
  organizationId: string;
  metrics: DashboardMetrics;
  health: DashboardHealth;
  desktopAgents: DesktopAgentRecord[];
  recentSales: DashboardRecentSale[];
  alerts: DashboardAlert[];
  checkedAt: string;
}
