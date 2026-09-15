import type { RemoteCommandRecord, RemoteCommandType } from "../shared/remoteCommands.js";
import type { CommandExecutionLog } from "./types.js";

function formatTime(date = new Date()) {
  return date.toISOString();
}

export class AgentLogger {
  private prefix = "[DesktopAgent]";

  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.log(`${this.prefix} ${formatTime()} | ${message}`, meta);
      return;
    }
    console.log(`${this.prefix} ${formatTime()} | ${message}`);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.warn(`${this.prefix} ${formatTime()} | ${message}`, meta);
      return;
    }
    console.warn(`${this.prefix} ${formatTime()} | ${message}`);
  }

  error(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      console.error(`${this.prefix} ${formatTime()} | ${message}`, meta);
      return;
    }
    console.error(`${this.prefix} ${formatTime()} | ${message}`);
  }

  commandStart(record: RemoteCommandRecord) {
    this.info("Comando recebido", {
      commandId: record.id,
      command: record.command,
      source: record.source,
      priority: record.priority,
      agentId: record.agent_id,
      target: record.target,
    });
  }

  commandSuccess(log: CommandExecutionLog) {
    this.info("Comando executado com sucesso", {
      commandId: log.commandId,
      command: log.command,
      hora: log.completedAt,
      durationMs: log.durationMs,
      result: log.result,
    });
  }

  commandFailure(log: CommandExecutionLog) {
    this.error("Falha na execução do comando", {
      commandId: log.commandId,
      command: log.command,
      hora: log.completedAt,
      durationMs: log.durationMs,
      error: log.error,
    });
  }

  commandSkipped(commandId: string, command: RemoteCommandType, reason: string) {
    this.warn("Comando ignorado", { commandId, command, reason });
  }
}

export const agentLogger = new AgentLogger();
