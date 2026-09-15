import { describe, expect, it, vi, beforeEach } from "vitest";
import { CommandDispatcher } from "../../../apps/desktop/electron/src/agent/CommandDispatcher.js";
import { CommandRegistry } from "../../../apps/desktop/electron/src/agent/CommandRegistry.js";
import { REMOTE_COMMANDS } from "../../../apps/desktop/electron/src/shared/remoteCommands.js";
import { createRemoteCommandRecord } from "../../fixtures/remoteCommands";

vi.mock("../../../apps/desktop/electron/src/agent/logger.js", () => ({
  agentLogger: {
    commandStart: vi.fn(),
    commandSuccess: vi.fn(),
    commandFailure: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CommandDispatcher", () => {
  let registry: CommandRegistry;
  let dispatcher: CommandDispatcher;

  beforeEach(() => {
    registry = new CommandRegistry();
    dispatcher = new CommandDispatcher(registry);
  });

  it("retorna erro quando handler não registrado", async () => {
    const record = createRemoteCommandRecord({
      command: REMOTE_COMMANDS.PRINT_ORDER,
    });

    const { result, log } = await dispatcher.dispatch(record);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Handler não registrado");
    expect(log.ok).toBe(false);
  });

  it("executa handler registrado com sucesso", async () => {
    registry.register({
      command: REMOTE_COMMANDS.PRINT_ORDER,
      execute: vi.fn().mockResolvedValue({ ok: true, data: { printed: true } }),
    });

    const record = createRemoteCommandRecord();
    const { result, log } = await dispatcher.dispatch(record);

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ printed: true });
    expect(log.ok).toBe(true);
    expect(log.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captura exceção do handler", async () => {
    registry.register({
      command: REMOTE_COMMANDS.PRINT_ORDER,
      execute: vi.fn().mockRejectedValue(new Error("Impressora offline")),
    });

    const { result, log } = await dispatcher.dispatch(createRemoteCommandRecord());
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Impressora offline");
    expect(log.error).toBe("Impressora offline");
  });

  it("propaga falha retornada pelo handler", async () => {
    registry.register({
      command: REMOTE_COMMANDS.OPEN_DRAWER,
      execute: vi.fn().mockResolvedValue({ ok: false, error: "Gaveta travada" }),
    });

    const record = createRemoteCommandRecord({
      command: REMOTE_COMMANDS.OPEN_DRAWER,
    });
    const { result, log } = await dispatcher.dispatch(record);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Gaveta travada");
    expect(log.ok).toBe(false);
  });
});
