import type { IpcMainInvokeEvent } from "electron";
import type {
  DesktopInvokeRequest,
  DesktopInvokeResponse,
  DesktopStatus,
  PrintJobPayload,
} from "./channels.js";

export type IpcHandler = (
  event: IpcMainInvokeEvent,
  request: DesktopInvokeRequest
) => Promise<DesktopInvokeResponse>;

export interface PreloadApi {
  invoke<T = unknown>(
    request: DesktopInvokeRequest
  ): Promise<DesktopInvokeResponse<T>>;
  getStatus(): Promise<DesktopStatus>;
  getPrintQueue(): Promise<PrintJobPayload[]>;
  enqueuePrint(job: PrintJobPayload): Promise<DesktopInvokeResponse>;
  openDrawer(): Promise<DesktopInvokeResponse>;
  syncNow(): Promise<DesktopInvokeResponse>;
  checkUpdate(): Promise<DesktopInvokeResponse>;
  updaterGetStatus(): Promise<unknown>;
  updaterDownload(): Promise<DesktopInvokeResponse>;
  updaterInstall(request: {
    when: "now" | "quit";
    criticalOperation?: boolean;
    criticalReason?: string;
  }): Promise<DesktopInvokeResponse>;
  updaterDismiss(): Promise<DesktopInvokeResponse>;
  runBackup(): Promise<DesktopInvokeResponse>;
  offlineEnqueue(
    operation: Record<string, unknown>
  ): Promise<DesktopInvokeResponse>;
  onEvent(
    callback: (payload: { type: string; data?: unknown }) => void
  ): () => void;
  isDesktop: true;
  version: string;
}

declare global {
  interface Window {
    cosmoDesktop?: PreloadApi;
  }
}

export type { DesktopInvokeRequest, DesktopInvokeResponse, DesktopStatus };
