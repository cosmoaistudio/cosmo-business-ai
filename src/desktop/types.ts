import type { DesktopUpdateStatus } from "./updater/types";

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

export interface CosmoDesktopApi {
  isDesktop: true;
  version: string;
  invoke<T = unknown>(request: {
    command: DesktopCommandType;
    payload?: Record<string, unknown>;
  }): Promise<{ ok: boolean; data?: T; error?: string }>;
  getStatus(): Promise<DesktopStatus>;
  getPrintQueue(): Promise<PrintJobPayload[]>;
  enqueuePrint(job: PrintJobPayload): Promise<{ ok: boolean; error?: string }>;
  openDrawer(): Promise<{ ok: boolean; error?: string }>;
  syncNow(): Promise<{ ok: boolean; error?: string }>;
  checkUpdate(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  updaterGetStatus(): Promise<DesktopUpdateStatus>;
  updaterDownload(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  updaterInstall(request: {
    when: "now" | "quit";
    criticalOperation?: boolean;
    criticalReason?: string;
  }): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  updaterDismiss(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  runBackup(): Promise<{ ok: boolean; error?: string }>;
  offlineEnqueue(
    operation: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }>;
  hardwareDiagnostics(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printDetect(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printGetConfig(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printSaveConfig(
    config: unknown
  ): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printTest(
    role?: string
  ): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printReprintLast(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  printTicket(
    payload: unknown
  ): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleGetConfig(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleSaveConfig(
    config: unknown
  ): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleListPorts(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleCapabilities(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleConnect(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleDisconnect(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleRead(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleZero(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleTare(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  scaleTest(): Promise<{ ok: boolean; data?: unknown; error?: string }>;
  onEvent(
    callback: (payload: { type: string; data?: unknown }) => void
  ): () => void;
  /** Signal Electron that a loading/auth shell has painted (no empty Main reveal) */
  notifyVisualReady?: () => void;
  /** Open HTTPS URL in the system browser (Google OAuth). */
  openExternal?: (url: string) => Promise<{ ok: boolean; error?: string }>;
  /** Deep-link OAuth callback from Main (cosmobusiness://auth/callback). */
  onAuthCallback?: (callback: (payload: { url: string }) => void) => () => void;
  /** Cold-start callback buffered before renderer subscribed. */
  getPendingAuthCallback?: () => Promise<{ url: string } | null>;
  /** Drop buffered OAuth deep link (logout) so it cannot recreate a session. */
  clearPendingAuthCallback?: () => Promise<{ ok: boolean }>;
  /** Start loopback page that shows OAuth success + opens deep link. */
  ensureOAuthLandingServer?: () => Promise<{
    ok: boolean;
    redirectUrl?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    cosmoDesktop?: CosmoDesktopApi;
  }
}

export function isDesktopApp() {
  return typeof window !== "undefined" && Boolean(window.cosmoDesktop?.isDesktop);
}

export function getDesktopApi() {
  return window.cosmoDesktop;
}
