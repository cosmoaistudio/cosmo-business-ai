import type { DomainEvent, DomainEventPayload, DomainEventType } from "../types/events";

type EventHandler = (event: DomainEvent) => void | Promise<void>;
type Unsubscribe = () => void;

function createEventId() {
  return crypto.randomUUID();
}

class EventBusImpl {
  private handlers = new Map<string, Set<EventHandler>>();
  private wildcardHandlers = new Set<EventHandler>();

  publish<T extends DomainEventType>(
    type: T,
    payload: DomainEventPayload = {}
  ): DomainEvent<T> {
    const event: DomainEvent<T> = {
      type,
      payload: {
        ...payload,
        emittedAt: payload.emittedAt ?? new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      id: createEventId(),
    };

    const typeHandlers = this.handlers.get(type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        void this.safeInvoke(handler, event);
      }
    }

    for (const handler of this.wildcardHandlers) {
      void this.safeInvoke(handler, event);
    }

    return event;
  }

  subscribe(type: DomainEventType, handler: EventHandler): Unsubscribe {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  subscribeAll(handler: EventHandler): Unsubscribe {
    this.wildcardHandlers.add(handler);

    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  clear() {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  private async safeInvoke(handler: EventHandler, event: DomainEvent) {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[EventBus] Erro no handler de ${event.type}:`, error);
    }
  }
}

export const eventBus = new EventBusImpl();

export type { DomainEvent, DomainEventPayload, DomainEventType };
