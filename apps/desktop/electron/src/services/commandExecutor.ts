import { BrowserWindow } from "electron";
import {
  DESKTOP_COMMANDS,
  type DesktopCommandType,
  type PrintJobPayload,
} from "../ipc/channels.js";
import { autoUpdaterService } from "../updater/autoUpdaterService.js";
import { cashDrawerService } from "./cashDrawerService.js";
import { offlineSyncService } from "./offlineSyncService.js";
import { printerService } from "../printer/printerService.js";

export class CommandExecutor {
  private windows = new Set<BrowserWindow>();

  registerWindow(window: BrowserWindow) {
    this.windows.add(window);
    window.on("closed", () => this.windows.delete(window));
  }

  async execute(command: DesktopCommandType, payload: Record<string, unknown>) {
    switch (command) {
      case DESKTOP_COMMANDS.PRINT_RECEIPT:
        return this.printReceipt(payload as unknown as PrintJobPayload);

      case DESKTOP_COMMANDS.PRINT_ORDER:
        return this.printOrder(payload as unknown as PrintJobPayload);

      case DESKTOP_COMMANDS.OPEN_DRAWER:
        await cashDrawerService.open();
        return { ok: true };

      case DESKTOP_COMMANDS.SYNC_DATABASE:
        return offlineSyncService.sync();

      case DESKTOP_COMMANDS.UPDATE_SYSTEM:
        return autoUpdaterService.checkForUpdates();

      case DESKTOP_COMMANDS.RUN_BACKUP:
        return offlineSyncService.runBackup();

      default:
        return { ok: false, error: `Comando não suportado: ${command}` };
    }
  }

  broadcast(type: string, data?: unknown) {
    for (const window of this.windows) {
      if (!window.isDestroyed()) {
        window.webContents.send("cosmo:event", { type, data });
      }
    }
  }

  private async printReceipt(payload: PrintJobPayload) {
    const job = await printerService.printReceipt(payload);
    this.broadcast("print-enqueued", job);
    return { ok: true, data: job };
  }

  private async printOrder(payload: PrintJobPayload) {
    const job = await printerService.printOrder(payload);
    this.broadcast("print-enqueued", job);
    return { ok: true, data: job };
  }
}

export const commandExecutor = new CommandExecutor();
