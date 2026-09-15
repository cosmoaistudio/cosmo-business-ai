import { describe, expect, it, vi } from "vitest";
import { CommandRegistry } from "../../../apps/desktop/electron/src/agent/CommandRegistry.js";
import { REMOTE_COMMANDS } from "../../../apps/desktop/electron/src/shared/remoteCommands.js";

describe("CommandRegistry", () => {
  it("registra e recupera handlers", () => {
    const registry = new CommandRegistry();
    const handler = {
      command: REMOTE_COMMANDS.PRINT_ORDER,
      execute: vi.fn(),
    };

    registry.register(handler);
    expect(registry.has(REMOTE_COMMANDS.PRINT_ORDER)).toBe(true);
    expect(registry.get(REMOTE_COMMANDS.PRINT_ORDER)).toBe(handler);
    expect(registry.list()).toContain(REMOTE_COMMANDS.PRINT_ORDER);
  });

  it("registerMany registra múltiplos handlers", () => {
    const registry = new CommandRegistry();
    registry.registerMany([
      {
        command: REMOTE_COMMANDS.OPEN_DRAWER,
        execute: vi.fn(),
      },
      {
        command: REMOTE_COMMANDS.PAUSE_PRODUCT,
        execute: vi.fn(),
      },
    ]);

    expect(registry.list()).toHaveLength(2);
  });
});
