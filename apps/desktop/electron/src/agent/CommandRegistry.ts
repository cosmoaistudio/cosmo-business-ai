import type { RemoteCommandType } from "../shared/remoteCommands.js";
import type { CommandHandler } from "./types.js";

export class CommandRegistry {
  private handlers = new Map<RemoteCommandType, CommandHandler>();

  register(handler: CommandHandler) {
    this.handlers.set(handler.command, handler);
  }

  registerMany(handlers: CommandHandler[]) {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  get(command: RemoteCommandType): CommandHandler | undefined {
    return this.handlers.get(command);
  }

  has(command: RemoteCommandType) {
    return this.handlers.has(command);
  }

  list() {
    return [...this.handlers.keys()];
  }
}

export const commandRegistry = new CommandRegistry();
