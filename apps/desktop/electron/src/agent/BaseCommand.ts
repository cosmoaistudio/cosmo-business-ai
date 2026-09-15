import type { RemoteCommandResult, RemoteCommandType } from "../shared/remoteCommands.js";
import type { CommandContext, CommandHandler } from "./types.js";

export abstract class BaseCommand implements CommandHandler {
  abstract readonly command: RemoteCommandType;

  abstract run(context: CommandContext): Promise<RemoteCommandResult>;

  async execute(context: CommandContext): Promise<RemoteCommandResult> {
    return this.run(context);
  }
}
