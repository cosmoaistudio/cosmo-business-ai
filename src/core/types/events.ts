/**
 * Catálogo central de eventos de domínio do Cosmo Business AI.
 * Todo módulo DEVE publicar eventos via EventBus — nunca chamar outro módulo diretamente.
 */
export const DomainEvents = {
  // Produtos
  ProductCreated: "ProductCreated",
  ProductUpdated: "ProductUpdated",
  ProductDeleted: "ProductDeleted",
  ProductPaused: "ProductPaused",
  ProductActivated: "ProductActivated",

  // Estoque
  StockChanged: "StockChanged",

  // PDV / Vendas
  SaleCompleted: "SaleCompleted",

  // Clientes
  CustomerCreated: "CustomerCreated",
  CustomerUpdated: "CustomerUpdated",
  CustomerInactive: "CustomerInactive",

  // Opções / Composição
  OptionPaused: "OptionPaused",
  OptionActivated: "OptionActivated",

  // Pedidos
  OrderCreated: "OrderCreated",
  OrderCompleted: "OrderCompleted",

  // Financeiro
  PaymentReceived: "PaymentReceived",
  PaymentOverdue: "PaymentOverdue",

  // Cosmo AI
  InsightCreated: "InsightCreated",
  InsightResolved: "InsightResolved",
  InsightIgnored: "InsightIgnored",

  // UI / Sistema
  DataChanged: "DataChanged",
} as const;

export type DomainEventType = (typeof DomainEvents)[keyof typeof DomainEvents];

export interface DomainEventPayload {
  [key: string]: unknown;
  module?: string;
  entityId?: string;
  entityType?: string;
  source?: "user" | "automation" | "system";
  emittedAt?: string;
}

export interface DomainEvent<T extends DomainEventType = DomainEventType> {
  type: T;
  payload: DomainEventPayload;
  timestamp: string;
  id: string;
}

/** Mapeamento legado (automation_rules.trigger_type) → evento de domínio */
export const LEGACY_TRIGGER_TO_DOMAIN: Record<string, DomainEventType> = {
  STOCK_CHANGED: DomainEvents.StockChanged,
  SALE_COMPLETED: DomainEvents.SaleCompleted,
  PRODUCT_PAUSED: DomainEvents.ProductPaused,
  PRODUCT_ACTIVATED: DomainEvents.ProductActivated,
  OPTION_PAUSED: DomainEvents.OptionPaused,
  OPTION_ACTIVATED: DomainEvents.OptionActivated,
  CUSTOMER_CREATED: DomainEvents.CustomerCreated,
  CUSTOMER_UPDATED: DomainEvents.CustomerUpdated,
  CUSTOMER_INACTIVE: DomainEvents.CustomerInactive,
  PAYMENT_RECEIVED: DomainEvents.PaymentReceived,
  PAYMENT_OVERDUE: DomainEvents.PaymentOverdue,
  ORDER_CREATED: DomainEvents.OrderCreated,
  ORDER_COMPLETED: DomainEvents.OrderCompleted,
};

/** Mapeamento evento de domínio → trigger legado (automation_rules) */
export const DOMAIN_TO_LEGACY_TRIGGER: Partial<Record<DomainEventType, string>> =
  Object.fromEntries(
    Object.entries(LEGACY_TRIGGER_TO_DOMAIN).map(([legacy, domain]) => [
      domain,
      legacy,
    ])
  ) as Partial<Record<DomainEventType, string>>;

/** Tipos legados mantidos para compatibilidade retroativa */
export const LEGACY_AUTOMATION_EVENT_TYPES = [
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
] as const;

export type LegacyAutomationEventType =
  (typeof LEGACY_AUTOMATION_EVENT_TYPES)[number];

export function legacyToDomainEvent(
  legacyType: LegacyAutomationEventType
): DomainEventType {
  return LEGACY_TRIGGER_TO_DOMAIN[legacyType] ?? DomainEvents.DataChanged;
}

export function domainToLegacyTrigger(
  domainType: DomainEventType
): string | undefined {
  return DOMAIN_TO_LEGACY_TRIGGER[domainType];
}
