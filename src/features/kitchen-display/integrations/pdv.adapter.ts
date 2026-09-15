import { eventBus } from "@/core/event-bus/EventBus";
import { DomainEvents } from "@/core/types/events";

export function subscribePdvKitchenRefresh(onRefresh: () => void) {
  return eventBus.subscribe(DomainEvents.SaleCompleted, () => {
    onRefresh();
  });
}
