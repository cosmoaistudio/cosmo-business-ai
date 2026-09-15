import { app } from "electron";

/**
 * Lightweight performance markers — only in development / explicit debug.
 * Enable in packaged builds with COSMO_PERF=1.
 */
export function isPerfLoggingEnabled() {
  return !app.isPackaged || process.env.COSMO_PERF === "1";
}

export function perfLog(event: string, detail?: string) {
  if (!isPerfLoggingEnabled()) return;
  if (detail) {
    console.info(`[Cosmo Performance] ${event} — ${detail}`);
  } else {
    console.info(`[Cosmo Performance] ${event}`);
  }
}
