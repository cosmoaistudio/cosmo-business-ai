import { describe, expect, it, vi, beforeEach } from "vitest";
import { DesktopAgent } from "../../../apps/desktop/electron/src/agent/DesktopAgent.js";

vi.mock("../../../apps/desktop/electron/src/agent/logger.js", () => ({
  agentLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    commandStart: vi.fn(),
    commandSuccess: vi.fn(),
    commandFailure: vi.fn(),
    commandSkipped: vi.fn(),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/config/DesktopConfig.js", () => ({
  desktopConfig: {
    load: vi.fn().mockResolvedValue(undefined),
    getOrganizationId: vi.fn().mockReturnValue("org-1"),
    getDesktopName: vi.fn().mockReturnValue("Desktop Test"),
    getEnvironment: vi.fn().mockReturnValue("test"),
    getAgentId: vi.fn().mockReturnValue("agent-1"),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/repository/desktopAgent.repository.js", () => ({
  desktopAgentRepository: {
    register: vi.fn().mockResolvedValue(undefined),
    touch: vi.fn().mockResolvedValue(undefined),
    setStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/repository/remoteCommand.repository.js", () => ({
  remoteCommandRepository: {
    claimPending: vi.fn().mockResolvedValue([]),
    acknowledge: vi.fn(),
    finalize: vi.fn(),
    cancelExpired: vi.fn(),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/RealtimeListener.js", () => ({
  realtimeListener: {
    start: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn(),
    claimPending: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../../../apps/desktop/electron/src/agent/health/HealthCheck.js", () => ({
  healthCheck: { run: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("../../../apps/desktop/electron/src/agent/commands/registerCommands.js", () => ({
  registerAllCommands: vi.fn(),
}));

vi.mock("../../../apps/desktop/electron/src/agent/CommandDispatcher.js", () => ({
  commandDispatcher: {
    dispatch: vi.fn().mockResolvedValue({ result: { ok: true }, log: {} }),
  },
}));

import { realtimeListener } from "../../../apps/desktop/electron/src/agent/RealtimeListener.js";
import { desktopAgentRepository } from "../../../apps/desktop/electron/src/agent/repository/desktopAgent.repository.js";
import { DESKTOP_LIFECYCLE_STATUS } from "../../../apps/desktop/electron/src/agent/status/DesktopLifecycleStatus.js";

describe("DesktopAgent", () => {
  let agent: DesktopAgent;

  beforeEach(() => {
    agent = new DesktopAgent();
  });

  it("inicia e registra agente", async () => {
    await agent.start();
    expect(agent.isStarted()).toBe(true);
    expect(desktopAgentRepository.register).toHaveBeenCalled();
    expect(realtimeListener.start).toHaveBeenCalled();
    expect(agent.getLifecycleStatus()).toBe(DESKTOP_LIFECYCLE_STATUS.ONLINE);
  });

  it("não reinicia se já iniciado", async () => {
    await agent.start();
    await agent.start();
    expect(desktopAgentRepository.register).toHaveBeenCalledTimes(1);
  });

  it("encerra e marca offline", async () => {
    await agent.start();
    await agent.shutdown();
    expect(agent.isStarted()).toBe(false);
    expect(realtimeListener.shutdown).toHaveBeenCalled();
    expect(desktopAgentRepository.setStatus).toHaveBeenCalled();
    expect(agent.getLifecycleStatus()).toBe(DESKTOP_LIFECYCLE_STATUS.STOPPED);
  });

  it("shutdown sem start marca stopped", async () => {
    await agent.shutdown();
    expect(agent.getLifecycleStatus()).toBe(DESKTOP_LIFECYCLE_STATUS.STOPPED);
  });
});
