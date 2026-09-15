import type {
  RemoteCommandRecord,
  RemoteCommandResult,
  RemoteCommandType,
} from "../shared/remoteCommands.js";

export interface CommandContext {
  record: RemoteCommandRecord;
  agentId: string | null;
  organizationId: string;
}

export interface CommandHandler {
  readonly command: RemoteCommandType;
  execute(context: CommandContext): Promise<RemoteCommandResult>;
}

export interface CommandExecutionLog {
  commandId: string;
  command: RemoteCommandType;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export type CommandRecordHandler = (record: RemoteCommandRecord) => Promise<void>;

export type CommandEventPublisher = (
  type: string,
  payload: Record<string, unknown>
) => void;
