import {
  REALTIME_BROADCAST_EVENT,
  REMOTE_COMMAND_STATUS,
  DESKTOP_AGENT_STATUS,
  type RemoteCommandRecord,
} from "../shared/remoteCommands.js";
import { desktopConfig } from "./config/DesktopConfig.js";
import { commandDispatcher } from "./CommandDispatcher.js";
import { commandRegistry } from "./CommandRegistry.js";
import { healthCheck } from "./health/HealthCheck.js";
import { agentLogger } from "./logger.js";
import { registerAllCommands } from "./commands/registerCommands.js";
import { desktopAgentRepository } from "./repository/desktopAgent.repository.js";
import { remoteCommandRepository } from "./repository/remoteCommand.repository.js";
import { realtimeListener } from "./RealtimeListener.js";
import {
  DESKTOP_LIFECYCLE_STATUS,
  desktopStatusManager,
} from "./status/DesktopLifecycleStatus.js";

export class DesktopAgent {
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  private processing = new Set<string>();
  private started = false;

  getLifecycleStatus() {
    return desktopStatusManager.get();
  }

  isStarted() {
    return this.started;
  }

  async start() {
    if (this.started) return;

    desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.STARTING);
    agentLogger.info("Iniciando Desktop Agent");

    registerAllCommands();
    agentLogger.info("Comandos registrados", {
      commands: commandRegistry.list(),
    });

    await desktopConfig.load();
    agentLogger.info("Configuração carregada", {
      organizationId: desktopConfig.getOrganizationId(),
      desktopName: desktopConfig.getDesktopName(),
      environment: desktopConfig.getEnvironment(),
    });

    await desktopAgentRepository.register();
    this.startHeartbeat();

    await realtimeListener.start((record) => this.processCommand(record));

    await healthCheck.run();
    this.startHealthMonitor();

    if (desktopStatusManager.get() === DESKTOP_LIFECYCLE_STATUS.STARTING) {
      desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.ONLINE);
    }

    this.started = true;
    agentLogger.info("Desktop Agent pronto", {
      lifecycleStatus: desktopStatusManager.get(),
    });
  }

  async shutdown() {
    if (!this.started) {
      desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.STOPPED);
      return;
    }

    agentLogger.info("Encerrando Desktop Agent");

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.healthTimer) clearInterval(this.healthTimer);

    realtimeListener.shutdown();
    await desktopAgentRepository.setStatus(DESKTOP_AGENT_STATUS.OFFLINE);

    desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.STOPPED);
    this.started = false;
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      void desktopAgentRepository.touch();
    }, 30000);
  }

  private startHealthMonitor() {
    this.healthTimer = setInterval(() => {
      void healthCheck.run();
    }, 30000);
  }

  private async processCommand(record: RemoteCommandRecord) {
    if (!record?.id || this.processing.has(record.id)) return;

    const agentId = desktopConfig.getAgentId();
    const organizationId = desktopConfig.getOrganizationId();

    if (record.organization_id !== organizationId) {
      agentLogger.commandSkipped(record.id, record.command, "organização diferente");
      return;
    }

    if (
      record.status !== REMOTE_COMMAND_STATUS.PENDING &&
      record.status !== REMOTE_COMMAND_STATUS.PROCESSING
    ) {
      return;
    }

    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      await remoteCommandRepository.cancelExpired(record.id);
      return;
    }

    if (record.agent_id && agentId && record.agent_id !== agentId) {
      agentLogger.commandSkipped(record.id, record.command, "destinado a outro agente");
      return;
    }

    this.processing.add(record.id);

    try {
      if (agentId) {
        await remoteCommandRepository.acknowledge(record.id, agentId);
      }

      const { result, log } = await commandDispatcher.dispatch(record);

      const status = result.ok
        ? REMOTE_COMMAND_STATUS.COMPLETED
        : REMOTE_COMMAND_STATUS.FAILED;

      await remoteCommandRepository.finalize(
        record.id,
        status,
        result,
        log.durationMs
      );

      await this.publishResult(record, result, log);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao processar comando";

      await remoteCommandRepository.finalize(record.id, REMOTE_COMMAND_STATUS.FAILED, {
        ok: false,
        error: message,
      });

      await this.publishResult(record, { ok: false, error: message });
    } finally {
      this.processing.delete(record.id);
    }
  }

  private async publishResult(
    record: RemoteCommandRecord,
    result: { ok: boolean; data?: Record<string, unknown>; error?: string },
    log?: { durationMs: number; completedAt: string }
  ) {
    const event = result.ok ? "remote-command-completed" : "remote-command-failed";

    const payload = {
      commandId: record.id,
      command: record.command,
      result,
      durationMs: log?.durationMs,
      completedAt: log?.completedAt,
    };

    await realtimeListener.publishEvent(REALTIME_BROADCAST_EVENT, payload);
    await realtimeListener.publishEvent(event, payload);

    const { commandExecutor } = await import("../services/commandExecutor.js");
    commandExecutor.broadcast(event, payload);
  }
}

export const desktopAgent = new DesktopAgent();
