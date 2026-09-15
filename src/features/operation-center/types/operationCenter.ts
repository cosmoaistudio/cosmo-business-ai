export type OperationPeriod = "today" | "yesterday" | "7days" | "30days";

export type OperationStatusLevel = "normal" | "attention" | "critical";

export type OperationScreen =
  | "overview"
  | "operation"
  | "production"
  | "delivery"
  | "finance"
  | "ai";

export type OperationViewMode = "operational" | "manager" | "tv";

export type AlertSeverity = "critical" | "warning" | "info";

export type CriticalAlertType =
  | "paused_product"
  | "paused_option"
  | "stock_out"
  | "stock_critical"
  | "stock_low"
  | "order_overdue"
  | "kitchen_stalled"
  | "large_queue"
  | "product_unavailable"
  | "desktop_offline"
  | "cash_open"
  | "automation_failed"
  | "integration_offline";

export interface CriticalAlert {
  id: string;
  type: CriticalAlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  href?: string;
  timestamp?: string;
}

export interface OperationSummary {
  normal: number;
  attention: number;
  critical: number;
}

export interface RealtimeMetrics {
  ordersWaiting: number;
  ordersPreparing: number;
  ordersReady: number;
  ordersOverdue: number;
  averagePrepMinutes: number;
  kitchenQueueSize: number;
}

export interface ConnectivityStatus {
  desktopOnline: number;
  desktopTotal: number;
  mobileOnline: number;
  mobileTotal: number;
  cashiersOnline: number;
  cashiersTotal: number;
  deliveryOnline: number;
  deliveryTotal: number;
  realtimeConnected: boolean;
}

export type OperationalSectorId =
  | "kitchen"
  | "pdv"
  | "delivery"
  | "inventory"
  | "desktop"
  | "finance";

export interface OperationalSector {
  id: OperationalSectorId;
  label: string;
  status: OperationStatusLevel;
  metric: string;
  detail: string;
}

export interface OperationMetrics {
  activeProducts: number;
  pausedProducts: number;
  pausedGroups: number;
  waitingCustomers: number;
  ordersInPrep: number;
  overdueOrders: number;
  automationsToday: number;
  failuresToday: number;
  salesTodayTotal: number;
  salesTodayCount: number;
}

export type TimelineEventType =
  | "sale"
  | "product"
  | "product_paused"
  | "product_activated"
  | "stock"
  | "stock_critical"
  | "automation"
  | "customer"
  | "audit"
  | "option"
  | "desktop_connected"
  | "desktop_disconnected"
  | "print_sent"
  | "order_delivered";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  label: string;
  description: string;
  type: TimelineEventType;
  live?: boolean;
}

export interface HealthScoreBreakdown {
  overall: number;
  orders: number;
  stock: number;
  desktop: number;
  kitchen: number;
  realtime: number;
  finance: number;
  automations: number;
}

export type RecommendationPriority = "high" | "medium" | "low";

export type RecommendationType =
  | "restock"
  | "kitchen"
  | "campaign"
  | "automation_log"
  | "reactivate_product"
  | "reactivate_option";

export interface OperationRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  priority: RecommendationPriority;
}

export interface OperationCenterData {
  summary: OperationSummary;
  alerts: CriticalAlert[];
  metrics: OperationMetrics;
  realtime: RealtimeMetrics;
  connectivity: ConnectivityStatus;
  sectors: OperationalSector[];
  timeline: TimelineEvent[];
  liveTimeline: TimelineEvent[];
  health: HealthScoreBreakdown;
  recommendations: OperationRecommendation[];
  lastUpdated: string;
}

export interface OperationCenterFilters {
  period: OperationPeriod;
  organizationId?: string | null;
}

export const OPERATION_PERIOD_LABELS: Record<OperationPeriod, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7days": "7 dias",
  "30days": "30 dias",
};

export const OPERATION_SCREEN_LABELS: Record<OperationScreen, string> = {
  overview: "Visão Geral",
  operation: "Operação",
  production: "Produção",
  delivery: "Delivery",
  finance: "Financeiro",
  ai: "IA",
};

export const OPERATION_VIEW_MODE_LABELS: Record<OperationViewMode, string> = {
  operational: "Operacional",
  manager: "Gerente",
  tv: "TV",
};

export const CRITICAL_ALERT_SECTIONS: Array<{
  type: CriticalAlertType;
  emoji: string;
  label: string;
}> = [
  { type: "stock_low", emoji: "📉", label: "Estoque baixo" },
  { type: "stock_critical", emoji: "⚠️", label: "Estoque crítico" },
  { type: "stock_out", emoji: "📦", label: "Estoque zerado" },
  { type: "order_overdue", emoji: "🕐", label: "Pedido atrasado" },
  { type: "desktop_offline", emoji: "🖥️", label: "Desktop offline" },
  { type: "kitchen_stalled", emoji: "👨‍🍳", label: "Kitchen parada" },
  { type: "large_queue", emoji: "📋", label: "Fila grande" },
  { type: "product_unavailable", emoji: "🚫", label: "Produto indisponível" },
  { type: "paused_product", emoji: "⏸️", label: "Produtos pausados" },
  { type: "paused_option", emoji: "🧩", label: "Adicionais pausados" },
  { type: "cash_open", emoji: "💰", label: "Caixa aberto" },
  { type: "automation_failed", emoji: "⚙️", label: "Automações com erro" },
  { type: "integration_offline", emoji: "🔌", label: "Integrações offline" },
];

export const SECTOR_STATUS_COLORS: Record<OperationStatusLevel, string> = {
  normal: "border-emerald-400/60 bg-emerald-500/15 text-emerald-100",
  attention: "border-amber-400/60 bg-amber-500/15 text-amber-100",
  critical: "border-red-400/60 bg-red-500/15 text-red-100",
};

export const SECTOR_STATUS_DOT: Record<OperationStatusLevel, string> = {
  normal: "bg-emerald-400",
  attention: "bg-amber-400",
  critical: "bg-red-500 animate-pulse",
};
