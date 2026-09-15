import { describe, expect, it, vi, beforeEach } from "vitest";
import { RealtimeListener } from "../../../apps/desktop/electron/src/agent/RealtimeListener.js";

vi.mock("../../../apps/desktop/electron/src/agent/logger.js", () => ({
  agentLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/config/DesktopConfig.js", () => ({
  desktopConfig: {
    getAgentId: vi.fn().mockReturnValue("agent-1"),
    getOrganizationId: vi.fn().mockReturnValue("org-1"),
  },
}));

const mockClaimPending = vi.fn().mockResolvedValue([]);

vi.mock("../../../apps/desktop/electron/src/agent/repository/remoteCommand.repository.js", () => ({
  remoteCommandRepository: {
    claimPending: (...args: unknown[]) => mockClaimPending(...args),
  },
}));

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((cb?: (status: string) => void) => {
    cb?.("SUBSCRIBED");
    return mockChannel;
  }),
  send: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../../apps/desktop/electron/src/agent/repository/supabaseClient.js", () => ({
  getDesktopSupabase: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  })),
}));

describe("RealtimeListener (RealtimeManager desktop)", () => {
  let listener: RealtimeListener;

  beforeEach(() => {
    listener = new RealtimeListener();
    vi.clearAllMocks();
  });

  it("inicia desconectado", () => {
    expect(listener.isConnected()).toBe(false);
  });

  it("start conecta e reivindica comandos pendentes", async () => {
    const onCommand = vi.fn();
    await listener.start(onCommand);

    expect(mockClaimPending).toHaveBeenCalledWith("agent-1");
  });

  it("shutdown limpa conexão", async () => {
    await listener.start(vi.fn());
    listener.shutdown();
    expect(listener.isConnected()).toBe(false);
  });

  it("claimPending despacha registros para handler", async () => {
    const record = { id: "cmd-1", command: "PRINT_ORDER" };
    mockClaimPending.mockResolvedValueOnce([record]);
    const onCommand = vi.fn();
    await listener.start(onCommand);
    await listener.claimPending();
    expect(onCommand).toHaveBeenCalledWith(record);
  });

  it("publishEvent envia broadcast quando canal ativo", async () => {
    const { desktopConfig } = await import(
      "../../../apps/desktop/electron/src/agent/config/DesktopConfig.js"
    );
    vi.mocked(desktopConfig.getAgentId).mockReturnValue("agent-1");

    await listener.start(vi.fn());
    await listener.publishEvent("test-event", { ok: true });
    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: "broadcast", event: "test-event" })
    );
  });
});
