import type { RemoteCommandRecord, RemoteCommandResult } from "../shared/remoteCommands.js";
import { agentLogger } from "./logger.js";
import type { CommandExecutionLog, CommandHandler } from "./types.js";
import { commandRegistry } from "./CommandRegistry.js";

export class CommandDispatcher {
  constructor(private registry = commandRegistry) {}

  async dispatch(record: RemoteCommandRecord): Promise<{
    result: RemoteCommandResult;
    log: CommandExecutionLog;
  }> {
    const startedAt = new Date();
    agentLogger.commandStart(record);

    const handler = this.registry.get(record.command);

    if (!handler) {
      const completedAt = new Date();
      const log: CommandExecutionLog = {
        commandId: record.id,
        command: record.command,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ok: false,
        error: `Handler não registrado: ${record.command}`,
      };

      agentLogger.commandFailure(log);
      return { result: { ok: false, error: log.error }, log };
    }

    try {
      const result = await this.executeHandler(handler, record, startedAt);
      const completedAt = new Date();
      const log: CommandExecutionLog = {
        commandId: record.id,
        command: record.command,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ok: result.ok,
        result: result.data,
        error: result.error,
      };

      if (result.ok) {
        agentLogger.commandSuccess(log);
      } else {
        agentLogger.commandFailure(log);
      }

      return { result, log };
    } catch (error) {
      const completedAt = new Date();
      const message =
        error instanceof Error ? error.message : "Erro desconhecido ao executar comando";

      const log: CommandExecutionLog = {
        commandId: record.id,
        command: record.command,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
        ok: false,
        error: message,
      };

      agentLogger.commandFailure(log);
      return { result: { ok: false, error: message }, log };
    }
  }

  private async executeHandler(
    handler: CommandHandler,
    record: RemoteCommandRecord,
    _startedAt: Date
  ) {
    return handler.execute({
      record,
      agentId: record.agent_id ?? record.desktop_agent_id,
      organizationId: record.organization_id,
    });
  }
}

export const commandDispatcher = new CommandDispatcher();
