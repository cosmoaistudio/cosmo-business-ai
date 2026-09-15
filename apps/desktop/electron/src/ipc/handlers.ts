import { app, ipcMain } from "electron";
import {
  DESKTOP_COMMANDS,
  IPC_CHANNELS,
  type DesktopInvokeRequest,
  type DesktopStatus,
  type PrintJobPayload,
} from "./channels.js";
import { healthCheck } from "../agent/health/HealthCheck.js";
import { commandExecutor } from "../services/commandExecutor.js";
import { offlineSyncService } from "../services/offlineSyncService.js";
import { printerService } from "../printer/printerService.js";
import { autoUpdaterService } from "../updater/autoUpdaterService.js";
import { cashDrawerService } from "../services/cashDrawerService.js";
import { printManager } from "../hardware/printManager.js";
import { scaleManager } from "../hardware/scale/scaleManager.js";
import { runHardwareDiagnostics } from "../hardware/hardwareDiagnostics.js";
import type { PrinterRole, ScaleConnectionConfig } from "../hardware/types.js";
import type { Ticket80mmInput } from "../hardware/ticketLayout.js";
import {
  clearPendingAuthCallback,
  consumePendingAuthCallback,
  openExternalHttps,
} from "../main/oauthProtocol.js";
import { ensureOAuthLandingServer } from "../main/oauthLandingServer.js";

function okResult<T>(data: T) {
  return { ok: true as const, data };
}

function errResult(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : String(error),
  };
}

export function registerIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.INVOKE, async (_event, request: DesktopInvokeRequest) => {
    if (!request?.command) {
      return { ok: false, error: "Comando inválido" };
    }

    return commandExecutor.execute(request.command, request.payload ?? {});
  });

  ipcMain.handle(IPC_CHANNELS.GET_STATUS, async (): Promise<DesktopStatus> => {
    await healthCheck.run();

    return {
      online: healthCheck.isOnline(),
      version: app.getVersion(),
      supabaseConnected: healthCheck.isSupabaseConnected(),
      printQueueSize: printerService.getQueueSize(),
      offlineQueueSize: offlineSyncService.size(),
      lastSyncAt: offlineSyncService.getLastSyncAt(),
      updateAvailable: autoUpdaterService.isUpdateAvailable(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.GET_PRINT_QUEUE, async () => {
    return printerService.getQueue();
  });

  ipcMain.handle(IPC_CHANNELS.ENQUEUE_PRINT, async (_event, job: PrintJobPayload) => {
    if (job.type === "order") {
      return commandExecutor.execute(
        DESKTOP_COMMANDS.PRINT_ORDER,
        job as unknown as Record<string, unknown>
      );
    }

    return commandExecutor.execute(
      DESKTOP_COMMANDS.PRINT_RECEIPT,
      job as unknown as Record<string, unknown>
    );
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_DRAWER, async () => {
    await cashDrawerService.open();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_NOW, async () => {
    return offlineSyncService.sync();
  });

  ipcMain.handle(IPC_CHANNELS.CHECK_UPDATE, async () => {
    return autoUpdaterService.checkForUpdates();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATER_GET_STATUS, async () => {
    return autoUpdaterService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATER_DOWNLOAD, async () => {
    return autoUpdaterService.downloadUpdate();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATER_INSTALL, async (_event, request) => {
    return autoUpdaterService.installUpdate(request);
  });

  ipcMain.handle(IPC_CHANNELS.UPDATER_DISMISS, async () => {
    return autoUpdaterService.dismiss();
  });

  ipcMain.handle(IPC_CHANNELS.RUN_BACKUP, async () => {
    return offlineSyncService.runBackup();
  });

  ipcMain.handle(
    IPC_CHANNELS.OFFLINE_ENQUEUE,
    async (_event, operation: Record<string, unknown>) => {
      const type = String(operation.type ?? "unknown");
      const payload = (operation.payload as Record<string, unknown>) ?? operation;
      const saved = offlineSyncService.enqueue(type, payload);
      return { ok: true, data: saved };
    }
  );

  ipcMain.handle(IPC_CHANNELS.HARDWARE_DIAGNOSTICS, async () => {
    try {
      return okResult(await runHardwareDiagnostics());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_DETECT, async () => {
    try {
      return okResult({
        printers: await printManager.detectPrinters(),
        brands: printManager.getSupportedBrands(),
      });
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_GET_CONFIG, async () => {
    return okResult(printManager.getConfig());
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_SAVE_CONFIG, async (_event, config) => {
    try {
      return okResult(await printManager.saveConfig(config));
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_TEST, async (_event, role?: PrinterRole) => {
    try {
      await printManager.printTest(role ?? "cash");
      return okResult({ printed: true });
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_REPRINT_LAST, async () => {
    try {
      const result = await printManager.reprintLastTicket();
      if ("error" in result && result.error) return errResult(result.error);
      return okResult({ reprinted: true });
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRINT_TICKET, async (_event, payload: Ticket80mmInput & { role?: PrinterRole }) => {
    try {
      const { role, ...ticket } = payload;
      await printManager.printTicket80mm(ticket, role ?? "cash");
      return okResult({ printed: true });
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_GET_CONFIG, async () => {
    return okResult({
      config: scaleManager.getConfig(),
      connected: scaleManager.isConnected(),
    });
  });

  ipcMain.handle(
    IPC_CHANNELS.SCALE_SAVE_CONFIG,
    async (_event, config: ScaleConnectionConfig) => {
      try {
        return okResult(await scaleManager.saveConfig(config));
      } catch (error) {
        return errResult(error);
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.SCALE_LIST_PORTS, async () => {
    try {
      return okResult(await scaleManager.listPorts());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_CAPABILITIES, async () => {
    return okResult(scaleManager.getCapabilities());
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_CONNECT, async () => {
    try {
      return okResult(await scaleManager.connect());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_DISCONNECT, async () => {
    try {
      return okResult(await scaleManager.disconnect());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_READ, async () => {
    try {
      return okResult(await scaleManager.readWeight());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_ZERO, async () => {
    try {
      return okResult(await scaleManager.zero());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_TARE, async () => {
    try {
      return okResult(await scaleManager.tare());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCALE_TEST, async () => {
    try {
      return okResult(await scaleManager.testCommunication());
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, url: string) => {
    try {
      return await openExternalHttps(url);
    } catch (error) {
      return errResult(error);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_PENDING_AUTH_CALLBACK, async () => {
    const url = consumePendingAuthCallback();
    return url ? { url } : null;
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_PENDING_AUTH_CALLBACK, async () => {
    clearPendingAuthCallback();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.ENSURE_OAUTH_LANDING, async () => {
    try {
      return await ensureOAuthLandingServer();
    } catch (error) {
      return errResult(error);
    }
  });
}
