import type { TriggerCatalogItem } from "./types";

/**
 * Gatilhos (Eventos) — biblioteca separada das ações.
 * Itens `live` já existem no EventBus / AutomationEngine.
 * Itens `planned` são arquitetura de conexão entre módulos (sem execução V1).
 */
export const TRIGGER_CATALOG: TriggerCatalogItem[] = [
  {
    id: "sale-completed",
    triggerKey: "SALE_COMPLETED",
    label: "Venda finalizada",
    description: "Disparado quando uma venda do PDV é concluída.",
    module: "pdv",
    availability: "live",
    connects: ["dashboard", "business_brain", "finance", "inventory", "growth_hub"],
    example: "Atualizar indicadores, estoque e registrar atividade.",
  },
  {
    id: "stock-changed",
    triggerKey: "STOCK_CHANGED",
    label: "Estoque alterado",
    description: "Movimentação de estoque (entrada, saída ou ajuste).",
    module: "inventory",
    availability: "live",
    connects: ["inventory", "dashboard", "notifications"],
  },
  {
    id: "stock-critical",
    triggerKey: "STOCK_CRITICAL",
    label: "Estoque crítico",
    description: "Nível de estoque abaixo do mínimo configurado.",
    module: "inventory",
    availability: "planned",
    connects: ["inventory", "notifications", "tasks", "ai"],
    example: "Notificar e sugerir compra.",
  },
  {
    id: "product-out-of-stock",
    triggerKey: "PRODUCT_OUT_OF_STOCK",
    label: "Produto sem estoque",
    description: "Produto ou opção atingiu zero unidades.",
    module: "inventory",
    availability: "planned",
    connects: ["inventory", "pdv", "notifications"],
  },
  {
    id: "customer-created",
    triggerKey: "CUSTOMER_CREATED",
    label: "Novo cliente",
    description: "Cliente cadastrado na base.",
    module: "customers",
    availability: "live",
    connects: ["customers", "growth_hub", "business_brain"],
  },
  {
    id: "product-activated",
    triggerKey: "PRODUCT_ACTIVATED",
    label: "Novo produto (ativado)",
    description: "Produto ativado no catálogo.",
    module: "products",
    availability: "live",
    connects: ["dashboard", "growth_hub"],
  },
  {
    id: "order-created",
    triggerKey: "ORDER_CREATED",
    label: "Pedido criado",
    description: "Novo pedido registrado (cozinha / digital).",
    module: "orders",
    availability: "live",
    connects: ["orders", "dashboard", "notifications"],
  },
  {
    id: "order-completed",
    triggerKey: "ORDER_COMPLETED",
    label: "Pedido entregue",
    description: "Pedido concluído / entregue ao cliente.",
    module: "orders",
    availability: "live",
    connects: ["orders", "finance", "business_brain", "growth_hub"],
  },
  {
    id: "order-cancelled",
    triggerKey: "ORDER_CANCELLED",
    label: "Pedido cancelado",
    description: "Pedido cancelado antes da conclusão.",
    module: "orders",
    availability: "planned",
    connects: ["orders", "finance", "notifications", "ai"],
  },
  {
    id: "payment-received",
    triggerKey: "PAYMENT_RECEIVED",
    label: "Pagamento recebido",
    description: "Recebimento financeiro confirmado.",
    module: "finance",
    availability: "live",
    connects: ["finance", "dashboard", "business_brain"],
  },
  {
    id: "payment-overdue",
    triggerKey: "PAYMENT_OVERDUE",
    label: "Pagamento em atraso",
    description: "Conta a receber venceu sem quitação.",
    module: "finance",
    availability: "live",
    connects: ["finance", "notifications", "tasks"],
  },
  {
    id: "goal-reached",
    triggerKey: "GOAL_REACHED",
    label: "Meta atingida",
    description: "Meta operacional ou comercial atingida.",
    module: "system",
    availability: "planned",
    connects: ["business_brain", "growth_hub", "notifications", "ai"],
  },
  {
    id: "day-closed",
    triggerKey: "DAY_CLOSED",
    label: "Dia encerrado",
    description: "Fechamento do dia operacional.",
    module: "system",
    availability: "planned",
    connects: ["dashboard", "finance", "business_brain", "ai"],
  },
  {
    id: "product-paused",
    triggerKey: "PRODUCT_PAUSED",
    label: "Produto pausado",
    description: "Produto pausado no catálogo.",
    module: "products",
    availability: "live",
    connects: ["pdv", "notifications"],
  },
  {
    id: "customer-inactive",
    triggerKey: "CUSTOMER_INACTIVE",
    label: "Cliente inativo",
    description: "Cliente marcado como inativo.",
    module: "customers",
    availability: "live",
    connects: ["customers", "growth_hub"],
  },
];

export function getLiveTriggers() {
  return TRIGGER_CATALOG.filter((item) => item.availability === "live");
}

export function getPlannedTriggers() {
  return TRIGGER_CATALOG.filter((item) => item.availability === "planned");
}

export function findTriggerByKey(triggerKey: string) {
  return TRIGGER_CATALOG.find((item) => item.triggerKey === triggerKey);
}
