import { vi } from "vitest";

export function createEventBusMock() {
  const listeners = new Set<(event: { type: string; payload: unknown }) => void>();

  return {
    publish: vi.fn((type: string, payload: unknown = {}) => {
      for (const listener of listeners) {
        listener({ type, payload });
      }
    }),
    subscribeAll: vi.fn((callback: (event: { type: string; payload: unknown }) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }),
    subscribe: vi.fn(),
    clear: () => listeners.clear(),
  };
}
