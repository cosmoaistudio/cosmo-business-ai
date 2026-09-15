export type DesktopUpdatePhase =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "error";

export type DesktopUpdateInstallWhen = "now" | "quit";

export type DesktopUpdateChannel = "prerelease" | "stable";

export type DesktopUpdateProvider = "github" | "generic";

export interface DesktopUpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface DesktopUpdateStatus {
  phase: DesktopUpdatePhase;
  currentVersion: string;
  availableVersion: string | null;
  progress: DesktopUpdateProgress | null;
  message: string;
  error: string | null;
  packaged: boolean;
  feedUrl: string;
  installOnQuit: boolean;
  lastCheckedAt: string | null;
  provider: DesktopUpdateProvider;
  channel: DesktopUpdateChannel;
}

export interface DesktopUpdateInstallRequest {
  when: DesktopUpdateInstallWhen;
  /** Renderer reports an in-progress sale/order. Main refuses "now" if true. */
  criticalOperation?: boolean;
  criticalReason?: string;
}
