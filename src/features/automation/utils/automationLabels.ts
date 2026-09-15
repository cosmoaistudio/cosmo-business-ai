import type { AutomationEventType } from "@/lib/automation-events";
import type {
  AutomationActionType,
  AutomationModule,
} from "../types/automationRule";

export const AUTOMATION_MODULE_LABELS: Record<AutomationModule, string> = {
  products: "Produtos",
  inventory: "Estoque",
  pdv: "PDV",
  customers: "Clientes",
  finance: "Financeiro",
  orders: "Pedidos",
  system: "Sistema",
};

export const AUTOMATION_EVENT_LABELS: Record<AutomationEventType, string> = {
  STOCK_CHANGED: "Estoque alterado",
  SALE_COMPLETED: "Venda concluída",
  PRODUCT_PAUSED: "Produto pausado",
  PRODUCT_ACTIVATED: "Produto ativado",
  OPTION_PAUSED: "Opção pausada",
  OPTION_ACTIVATED: "Opção ativada",
  CUSTOMER_CREATED: "Cliente criado",
  CUSTOMER_UPDATED: "Cliente atualizado",
  CUSTOMER_INACTIVE: "Cliente inativado",
  PAYMENT_RECEIVED: "Pagamento recebido",
  PAYMENT_OVERDUE: "Pagamento em atraso",
  ORDER_CREATED: "Pedido criado",
  ORDER_COMPLETED: "Pedido concluído",
};

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  PAUSE_PRODUCT: "Pausar produto",
  ACTIVATE_PRODUCT: "Ativar produto",
  PAUSE_OPTION: "Pausar opção",
  ACTIVATE_OPTION: "Ativar opção",
  SEND_NOTIFICATION: "Enviar notificação",
  CREATE_FINANCIAL_ENTRY: "Criar lançamento financeiro",
  CREATE_PURCHASE_SUGGESTION: "Sugerir compra",
  SEND_EMAIL: "Enviar e-mail",
  SEND_WHATSAPP: "Enviar WhatsApp",
};

export const CONDITION_OPERATOR_LABELS = {
  eq: "é igual a",
  neq: "é diferente de",
  gt: "é maior que",
  gte: "é maior ou igual a",
  lt: "é menor que",
  lte: "é menor ou igual a",
  contains: "contém",
  exists: "existe",
} as const;

export const EVENTS_BY_MODULE: Record<AutomationModule, AutomationEventType[]> = {
  inventory: ["STOCK_CHANGED"],
  pdv: ["SALE_COMPLETED", "PAYMENT_RECEIVED"],
  products: ["PRODUCT_PAUSED", "PRODUCT_ACTIVATED"],
  customers: ["CUSTOMER_CREATED", "CUSTOMER_UPDATED", "CUSTOMER_INACTIVE"],
  finance: ["PAYMENT_RECEIVED", "PAYMENT_OVERDUE"],
  orders: ["ORDER_CREATED", "ORDER_COMPLETED"],
  system: [
    "STOCK_CHANGED",
    "SALE_COMPLETED",
    "PRODUCT_PAUSED",
    "PRODUCT_ACTIVATED",
    "OPTION_PAUSED",
    "OPTION_ACTIVATED",
    "CUSTOMER_CREATED",
    "CUSTOMER_UPDATED",
    "CUSTOMER_INACTIVE",
    "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE",
    "ORDER_CREATED",
    "ORDER_COMPLETED",
  ],
};

export function formatExecutionTime(ms: number | null | undefined) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function createConditionId() {
  return crypto.randomUUID();
}

export function createActionId() {
  return crypto.randomUUID();
}
