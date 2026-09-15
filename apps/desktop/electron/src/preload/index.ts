import { contextBridge, ipcRenderer } from "electron";
import {
  IPC_CHANNELS,
  type DesktopInvokeRequest,
  type PrintJobPayload,
} from "../ipc/channels.js";

const api = {
  isDesktop: true as const,
  version: process.env.npm_package_version ?? "0.0.0",

  invoke<T = unknown>(request: DesktopInvokeRequest) {
    return ipcRenderer.invoke(IPC_CHANNELS.INVOKE, request) as Promise<{
      ok: boolean;
      data?: T;
      error?: string;
    }>;
  },

  getStatus() {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_STATUS);
  },

  getPrintQueue() {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PRINT_QUEUE);
  },

  enqueuePrint(job: PrintJobPayload) {
    return ipcRenderer.invoke(IPC_CHANNELS.ENQUEUE_PRINT, job);
  },

  openDrawer() {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_DRAWER);
  },

  syncNow() {
    return ipcRenderer.invoke(IPC_CHANNELS.SYNC_NOW);
  },

  checkUpdate() {
    return ipcRenderer.invoke(IPC_CHANNELS.CHECK_UPDATE);
  },

  updaterGetStatus() {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATER_GET_STATUS);
  },

  updaterDownload() {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATER_DOWNLOAD);
  },

  updaterInstall(request: { when: "now" | "quit"; criticalOperation?: boolean; criticalReason?: string }) {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATER_INSTALL, request);
  },

  updaterDismiss() {
    return ipcRenderer.invoke(IPC_CHANNELS.UPDATER_DISMISS);
  },

  runBackup() {
    return ipcRenderer.invoke(IPC_CHANNELS.RUN_BACKUP);
  },

  offlineEnqueue(operation: Record<string, unknown>) {
    return ipcRenderer.invoke(IPC_CHANNELS.OFFLINE_ENQUEUE, operation);
  },

  hardwareDiagnostics() {
    return ipcRenderer.invoke(IPC_CHANNELS.HARDWARE_DIAGNOSTICS);
  },

  printDetect() {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_DETECT);
  },

  printGetConfig() {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_GET_CONFIG);
  },

  printSaveConfig(config: unknown) {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_SAVE_CONFIG, config);
  },

  printTest(role?: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_TEST, role);
  },

  printReprintLast() {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_REPRINT_LAST);
  },

  printTicket(payload: unknown) {
    return ipcRenderer.invoke(IPC_CHANNELS.PRINT_TICKET, payload);
  },

  scaleGetConfig() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_GET_CONFIG);
  },

  scaleSaveConfig(config: unknown) {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_SAVE_CONFIG, config);
  },

  scaleListPorts() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_LIST_PORTS);
  },

  scaleCapabilities() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_CAPABILITIES);
  },

  scaleConnect() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_CONNECT);
  },

  scaleDisconnect() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_DISCONNECT);
  },

  scaleRead() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_READ);
  },

  scaleZero() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_ZERO);
  },

  scaleTare() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_TARE);
  },

  scaleTest() {
    return ipcRenderer.invoke(IPC_CHANNELS.SCALE_TEST);
  },

  onEvent(callback: (payload: { type: string; data?: unknown }) => void) {
    const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
      callback(payload as { type: string; data?: unknown });
    };

    ipcRenderer.on(IPC_CHANNELS.EVENT, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT, listener);
  },

  /** First meaningful paint — keeps native splash until Main has content */
  notifyVisualReady() {
    ipcRenderer.send(IPC_CHANNELS.RENDERER_VISUAL_READY);
  },

  openExternal(url: string) {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url) as Promise<{
      ok: boolean;
      error?: string;
    }>;
  },

  onAuthCallback(callback: (payload: { url: string }) => void) {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { url: string }
    ) => {
      if (payload?.url) callback(payload);
    };

    ipcRenderer.on(IPC_CHANNELS.AUTH_CALLBACK, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.AUTH_CALLBACK, listener);
    };
  },

  getPendingAuthCallback() {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PENDING_AUTH_CALLBACK) as Promise<{
      url: string;
    } | null>;
  },

  clearPendingAuthCallback() {
    return ipcRenderer.invoke(
      IPC_CHANNELS.CLEAR_PENDING_AUTH_CALLBACK
    ) as Promise<{ ok: boolean }>;
  },

  ensureOAuthLandingServer() {
    return ipcRenderer.invoke(IPC_CHANNELS.ENSURE_OAUTH_LANDING) as Promise<{
      ok: boolean;
      redirectUrl?: string;
      error?: string;
    }>;
  },
};

contextBridge.exposeInMainWorld("cosmoDesktop", api);
