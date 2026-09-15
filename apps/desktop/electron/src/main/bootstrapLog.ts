/**
 * Structured startup diagnostics for Cosmo Desktop.
 * Never swallows errors — always logs clearly.
 */
import type { BrowserWindow } from "electron";

const PREFIX = "[Cosmo Desktop]";

export function bootLog(step: string, detail?: string) {
  if (detail) {
    console.info(`${PREFIX} ✔ ${step} — ${detail}`);
  } else {
    console.info(`${PREFIX} ✔ ${step}`);
  }
}

export function bootWarn(step: string, detail?: unknown) {
  console.warn(`${PREFIX} ⚠ ${step}`, detail ?? "");
}

export function bootError(step: string, error?: unknown) {
  const message =
    error instanceof Error
      ? error.stack || error.message
      : error != null
        ? String(error)
        : "";
  console.error(`${PREFIX} ✖ ${step}`, message);
}

export function attachRendererDiagnostics(window: BrowserWindow) {
  window.webContents.on("console-message", (_e, level, message) => {
    if (!message.includes("[Cosmo")) return;
    if (level >= 2) {
      console.error(`${PREFIX} [renderer]`, message);
    } else {
      console.info(`${PREFIX} [renderer]`, message);
    }
  });

  window.webContents.on("preload-error", (_e, preloadPath, error) => {
    bootError(`Preload falhou (${preloadPath})`, error);
  });

  window.webContents.on("did-fail-load", (_e, code, desc, url) => {
    bootError("Renderer did-fail-load", `${code} ${desc} url=${url}`);
  });

  window.webContents.on("render-process-gone", (_e, details) => {
    bootError("render-process-gone", details);
  });

  window.webContents.on("did-finish-load", () => {
    bootLog("Renderer did-finish-load");
  });
}
