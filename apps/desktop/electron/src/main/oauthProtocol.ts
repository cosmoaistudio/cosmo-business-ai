import path from "node:path";
import { app, shell } from "electron";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { bootLog, bootWarn } from "./bootstrapLog.js";
import { focusMainWindow, getMainWindow } from "./window.js";

export const ELECTRON_OAUTH_PROTOCOL = "cosmobusiness";

let pendingAuthCallbackUrl: string | null = null;

export function isCosmoOAuthCallbackUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${ELECTRON_OAUTH_PROTOCOL}:`) return false;
    if (parsed.hostname !== "auth") return false;
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return pathname === "/callback";
  } catch {
    return false;
  }
}

export function findCosmoOAuthUrlInArgv(argv: string[]): string | null {
  for (const arg of argv) {
    if (
      typeof arg === "string" &&
      arg.startsWith(`${ELECTRON_OAUTH_PROTOCOL}://`)
    ) {
      return arg;
    }
  }
  return null;
}

/** Register cosmobusiness:// as default protocol client (dev + packaged). */
export function registerCosmoOAuthProtocolClient() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      const ok = app.setAsDefaultProtocolClient(
        ELECTRON_OAUTH_PROTOCOL,
        process.execPath,
        [path.resolve(process.argv[1])]
      );
      bootLog("OAuth protocol client (dev)", String(ok));
      return;
    }
  }

  const ok = app.setAsDefaultProtocolClient(ELECTRON_OAUTH_PROTOCOL);
  bootLog("OAuth protocol client", String(ok));
}

/**
 * Buffer + notify renderer. Pending stays until getPendingAuthCallback consumes
 * so late subscribers still receive cold-start deep links.
 */
export function deliverAuthCallbackUrl(url: string) {
  if (!isCosmoOAuthCallbackUrl(url)) {
    bootWarn("OAuth callback rejeitado (protocolo/path inválido)");
    return;
  }

  pendingAuthCallbackUrl = url;

  const win = getMainWindow();
  if (
    win &&
    !win.isDestroyed() &&
    win.webContents &&
    !win.webContents.isDestroyed()
  ) {
    bootLog("OAuth callback → renderer");
    win.webContents.send(IPC_CHANNELS.AUTH_CALLBACK, { url });
    focusMainWindow();
    return;
  }

  bootLog("OAuth callback buffered (renderer ainda não pronto)");
}

export function consumePendingAuthCallback(): string | null {
  const url = pendingAuthCallbackUrl;
  pendingAuthCallbackUrl = null;
  return url;
}

/** Discard buffered deep link so logout cannot recreate a session later. */
export function clearPendingAuthCallback(): void {
  pendingAuthCallbackUrl = null;
}

export async function openExternalHttps(url: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof url !== "string" || !url.trim()) {
    return { ok: false, error: "URL inválida" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL inválida" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Somente URLs HTTPS são permitidas" };
  }

  await shell.openExternal(parsed.toString());
  return { ok: true };
}
