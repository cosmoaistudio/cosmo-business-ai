import { app } from "electron";
import { REMOTE_COMMANDS } from "../../shared/remoteCommands.js";
import { BaseCommand } from "../BaseCommand.js";
import { offlineSyncService } from "../../services/offlineSyncService.js";
import { printerService } from "../../printer/printerService.js";
import { printQueue } from "../../printer/printQueue.js";
import type { CommandContext } from "../types.js";

export class RunBackupCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.RUN_BACKUP;

  async run() {
    return offlineSyncService.runBackup();
  }
}

export class RestartPrinterCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.RESTART_PRINTER;

  async run({ record }: CommandContext) {
    if (record.payload.flushQueue === true) {
      await printQueue.shutdown();
    }

    await printerService.initialize(app.getPath("userData"));
    return { ok: true, data: { restarted: true } };
  }
}
