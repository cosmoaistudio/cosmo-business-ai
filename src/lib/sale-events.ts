import { DomainEvents } from "@/core/types/events";
import { eventBus } from "@/core/event-bus/EventBus";

/**
 * @deprecated Preferir eventBus.publish(DomainEvents.DataChanged, {}) de @/core
 */
export function emitDataChanged() {
  eventBus.publish(DomainEvents.DataChanged, { module: "system" });
}

/**
 * @deprecated Preferir eventBus.subscribe(DomainEvents.DataChanged, ...) de @/core
 */
export function onDataChanged(callback: () => void) {
  return eventBus.subscribe(DomainEvents.DataChanged, () => {
    callback();
  });
}
