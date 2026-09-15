import {
  domainToLegacyTrigger,
  legacyToDomainEvent,
  type LegacyAutomationEventType,
} from "@/core/types/events";
import { eventBus } from "@/core/event-bus/EventBus";
import type { DomainEventPayload } from "@/core/types/events";

export const AUTOMATION_EVENT_TYPES = [
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

export type AutomationEventType = (typeof AUTOMATION_EVENT_TYPES)[number];
export type AutomationEventPayload = DomainEventPayload;

export interface AutomationEventDetail {
  type: AutomationEventType;
  payload: AutomationEventPayload;
}

/**
 * @deprecated Preferir eventBus.publish(DomainEvents.X, payload) de @/core
 */
export function emitAutomationEvent(
  type: AutomationEventType,
  payload: AutomationEventPayload = {}
) {
  const domainType = legacyToDomainEvent(type);
  eventBus.publish(domainType, payload);
}

/**
 * @deprecated Preferir eventBus.subscribe de @/core
 */
export function onAutomationEvent(
  callback: (event: AutomationEventDetail) => void
) {
  return eventBus.subscribeAll((event) => {
    const legacyType = domainToLegacyTrigger(event.type) as
      | LegacyAutomationEventType
      | undefined;

    if (!legacyType) return;

    callback({
      type: legacyType,
      payload: event.payload,
    });
  });
}
