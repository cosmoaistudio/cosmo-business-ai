export const DESKTOP_LIFECYCLE_STATUS = {
  STARTING: "STARTING",
  ONLINE: "ONLINE",
  DEGRADED: "DEGRADED",
  OFFLINE: "OFFLINE",
  STOPPED: "STOPPED",
} as const;

export type DesktopLifecycleStatus =
  (typeof DESKTOP_LIFECYCLE_STATUS)[keyof typeof DESKTOP_LIFECYCLE_STATUS];

export class DesktopStatusManager {
  private status: DesktopLifecycleStatus = DESKTOP_LIFECYCLE_STATUS.STOPPED;

  get() {
    return this.status;
  }

  set(status: DesktopLifecycleStatus) {
    this.status = status;
  }

  isOperational() {
    return (
      this.status === DESKTOP_LIFECYCLE_STATUS.ONLINE ||
      this.status === DESKTOP_LIFECYCLE_STATUS.DEGRADED
    );
  }
}

export const desktopStatusManager = new DesktopStatusManager();
