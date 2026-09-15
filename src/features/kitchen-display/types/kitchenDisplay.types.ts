export const KITCHEN_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type KitchenStatus = (typeof KITCHEN_STATUSES)[number];

export const KITCHEN_STATUS_LABELS: Record<KitchenStatus, string> = {
  pending: "Aguardando",
  accepted: "Aceito",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const KITCHEN_COLUMNS = [
  "queue",
  "preparing",
  "ready",
  "delivered",
] as const;

export type KitchenColumn = (typeof KITCHEN_COLUMNS)[number];

export const KITCHEN_COLUMN_LABELS: Record<KitchenColumn, string> = {
  queue: "Fila de pedidos",
  preparing: "Em preparo",
  ready: "Prontos",
  delivered: "Entregues",
};

export const KITCHEN_COLUMN_STATUSES: Record<KitchenColumn, KitchenStatus[]> = {
  queue: ["pending", "accepted"],
  preparing: ["preparing"],
  ready: ["ready"],
  delivered: ["delivered", "cancelled"],
};

export const KITCHEN_WORKFLOW: Record<
  KitchenStatus,
  KitchenStatus | null
> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

export const KITCHEN_TICKET_TYPES = [
  "pickup",
  "dine_in",
  "delivery",
  "counter",
] as const;

export type KitchenTicketType = (typeof KITCHEN_TICKET_TYPES)[number];

export const KITCHEN_TICKET_TYPE_LABELS: Record<KitchenTicketType, string> = {
  pickup: "Retirada",
  dine_in: "Mesa",
  delivery: "Delivery",
  counter: "Balcão",
};

/** @deprecated Use KITCHEN_TICKET_TYPES */
export const KITCHEN_SERVICE_TYPES = KITCHEN_TICKET_TYPES;
/** @deprecated Use KitchenTicketType */
export type KitchenServiceType = KitchenTicketType;
/** @deprecated Use KITCHEN_TICKET_TYPE_LABELS */
export const KITCHEN_SERVICE_LABELS = KITCHEN_TICKET_TYPE_LABELS;

export const KITCHEN_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type KitchenPriority = (typeof KITCHEN_PRIORITIES)[number];

export const KITCHEN_PRIORITY_LABELS: Record<KitchenPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const KITCHEN_ITEM_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "cancelled",
] as const;

export type KitchenItemStatus = (typeof KITCHEN_ITEM_STATUSES)[number];

export interface KitchenTicketItem {
  id: string;
  saleItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  summary: string | null;
  status: KitchenItemStatus;
}

export interface KitchenTicket {
  id: string;
  organizationId: string;
  saleId: string;
  saleNumber: number;
  status: KitchenStatus;
  ticketType: KitchenTicketType;
  priority: KitchenPriority;
  assignedTo: string | null;
  customerName: string | null;
  notes: string | null;
  estimatedMinutes: number;
  items: KitchenTicketItem[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface KitchenMetrics {
  averagePrepMinutes: number;
  overdueCount: number;
  preparingCount: number;
  readyCount: number;
  queueCount: number;
}

export interface KitchenFilterState {
  ticketTypes: KitchenTicketType[];
}

export type KitchenFilterKey = "all" | KitchenTicketType;

export const KITCHEN_FILTER_LABELS: Record<KitchenFilterKey, string> = {
  all: "Todos",
  pickup: "Retirada",
  dine_in: "Mesa",
  delivery: "Delivery",
  counter: "Balcão",
};
