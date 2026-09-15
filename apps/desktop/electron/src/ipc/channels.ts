export const DESKTOP_COMMANDS = {
  PRINT_RECEIPT: "PRINT_RECEIPT",
  PRINT_ORDER: "PRINT_ORDER",
  OPEN_DRAWER: "OPEN_DRAWER",
  SYNC_DATABASE: "SYNC_DATABASE",
  UPDATE_SYSTEM: "UPDATE_SYSTEM",
  RUN_BACKUP: "RUN_BACKUP",
} as const;

export type DesktopCommandType =
  (typeof DESKTOP_COMMANDS)[keyof typeof DESKTOP_COMMANDS];

export const IPC_CHANNELS = {
  INVOKE: "cosmo:invoke",
  EVENT: "cosmo:event",
  GET_STATUS: "cosmo:get-status",
  GET_PRINT_QUEUE: "cosmo:get-print-queue",
  ENQUEUE_PRINT: "cosmo:enqueue-print",
  OPEN_DRAWER: "cosmo:open-drawer",
  SYNC_NOW: "cosmo:sync-now",
  CHECK_UPDATE: "cosmo:check-update",
  UPDATER_GET_STATUS: "cosmo:updater-get-status",
  UPDATER_DOWNLOAD: "cosmo:updater-download",
  UPDATER_INSTALL: "cosmo:updater-install",
  UPDATER_DISMISS: "cosmo:updater-dismiss",
  RUN_BACKUP: "cosmo:run-backup",
  OFFLINE_ENQUEUE: "cosmo:offline-enqueue",
  HARDWARE_DIAGNOSTICS: "cosmo:hardware-diagnostics",
  PRINT_DETECT: "cosmo:print-detect",
  PRINT_GET_CONFIG: "cosmo:print-get-config",
  PRINT_SAVE_CONFIG: "cosmo:print-save-config",
  PRINT_TEST: "cosmo:print-test",
  PRINT_REPRINT_LAST: "cosmo:print-reprint-last",
  PRINT_TICKET: "cosmo:print-ticket",
  SCALE_GET_CONFIG: "cosmo:scale-get-config",
  SCALE_SAVE_CONFIG: "cosmo:scale-save-config",
  SCALE_LIST_PORTS: "cosmo:scale-list-ports",
  SCALE_CAPABILITIES: "cosmo:scale-capabilities",
  SCALE_CONNECT: "cosmo:scale-connect",
  SCALE_DISCONNECT: "cosmo:scale-disconnect",
  SCALE_READ: "cosmo:scale-read",
  SCALE_ZERO: "cosmo:scale-zero",
  SCALE_TARE: "cosmo:scale-tare",
  SCALE_TEST: "cosmo:scale-test",
  /** Renderer finished first meaningful paint (loading shell / auth screen) */
  RENDERER_VISUAL_READY: "cosmo:renderer-visual-ready",
  /** Open HTTPS URL in the OS default browser (OAuth). */
  OPEN_EXTERNAL: "cosmo:open-external",
  /** Main → renderer: OAuth deep-link callback URL. */
  AUTH_CALLBACK: "cosmo:auth-callback",
  /** Renderer pulls buffered deep-link if it subscribed late. */
  GET_PENDING_AUTH_CALLBACK: "cosmo:get-pending-auth-callback",
  CLEAR_PENDING_AUTH_CALLBACK: "cosmo:clear-pending-auth-callback",
  /** Ensure loopback OAuth success page server is listening. */
  ENSURE_OAUTH_LANDING: "cosmo:ensure-oauth-landing",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface DesktopInvokeRequest {
  command: DesktopCommandType;
  payload?: Record<string, unknown>;
}

export interface DesktopInvokeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface DesktopStatus {
  online: boolean;
  version: string;
  supabaseConnected: boolean;
  printQueueSize: number;
  offlineQueueSize: number;
  lastSyncAt: string | null;
  updateAvailable: boolean;
}

export interface PrintJobPayload {
  id?: string;
  type: "receipt" | "order";
  driver?: "epson" | "bematech" | "elgin" | "daruma" | "generic";
  host?: string;
  port?: number;
  title?: string;
  lines: string[];
  openDrawer?: boolean;
}

export interface OfflineOperation {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}
