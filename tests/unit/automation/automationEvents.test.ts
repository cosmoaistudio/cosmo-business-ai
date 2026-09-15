import { describe, expect, it, vi } from "vitest";

const { eventBusMock } = vi.hoisted(() => {
  const mock = {
    publish: vi.fn(),
    subscribeAll: vi.fn(),
    _callback: null as ((event: { type: string; payload: unknown }) => void) | null,
  };
  mock.subscribeAll.mockImplementation(
    (callback: (event: { type: string; payload: unknown }) => void) => {
      mock._callback = callback;
      return () => undefined;
    }
  );
  return { eventBusMock: mock };
});

vi.mock("@/core/event-bus/EventBus", () => ({
  eventBus: eventBusMock,
}));

import {
  AUTOMATION_EVENT_TYPES,
  emitAutomationEvent,
  onAutomationEvent,
} from "@/lib/automation-events";
import { DomainEvents } from "@/core/types/events";

describe("automation-events", () => {
  it("exporta tipos de evento esperados", () => {
    expect(AUTOMATION_EVENT_TYPES).toContain("SALE_COMPLETED");
    expect(AUTOMATION_EVENT_TYPES).toContain("STOCK_CHANGED");
  });

  it("emitAutomationEvent publica no event bus", () => {
    emitAutomationEvent("SALE_COMPLETED", { saleId: "s1" });
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      DomainEvents.SaleCompleted,
      expect.objectContaining({ saleId: "s1" })
    );
  });

  it("onAutomationEvent escuta eventos do bus", () => {
    const received: string[] = [];
    onAutomationEvent((event) => received.push(event.type));

    eventBusMock._callback?.({
      type: DomainEvents.SaleCompleted,
      payload: { saleId: "s1" },
    });

    expect(received).toContain("SALE_COMPLETED");
  });

  it("ignora eventos sem mapeamento legado", () => {
    const received: string[] = [];
    onAutomationEvent((event) => received.push(event.type));

    eventBusMock._callback?.({
      type: DomainEvents.DataChanged,
      payload: {},
    });

    expect(received).toHaveLength(0);
  });
});
