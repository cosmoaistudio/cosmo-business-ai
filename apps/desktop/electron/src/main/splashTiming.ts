import { BrowserWindow, ipcMain } from "electron";
import { IPC_CHANNELS } from "../ipc/channels.js";
import { bootLog } from "./bootstrapLog.js";
import { bootTrace, startupTrace } from "./bootTiming.js";
import { destroySplashWindow } from "./splash.js";
import { perfLog } from "./perfLog.js";

/**
 * Absolute safety — never hang forever if the renderer never signals.
 * Does NOT force an empty Main early; only a last-resort reveal with boot shell.
 */
export const VISUAL_READY_MAX_MS = 20_000;

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Resolves when the renderer signals first meaningful paint
 * (boot shell HTML or React loading shell — NOT auth/session).
 */
export function waitForRendererVisualReady(): Promise<"ready" | "timeout"> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (reason: "ready" | "timeout") => {
      if (settled) return;
      settled = true;
      ipcMain.removeListener(IPC_CHANNELS.RENDERER_VISUAL_READY, onReady);
      resolve(reason);
    };

    const onReady = () => {
      bootTrace("Renderer", "visual-ready (IPC)");
      startupTrace("visual-ready");
      perfLog("visual-ready");
      finish("ready");
    };

    ipcMain.once(IPC_CHANNELS.RENDERER_VISUAL_READY, onReady);

    setTimeout(() => {
      if (!settled) {
        bootLog("visual-ready timeout — revelando Main com shell de segurança");
        bootTrace("Renderer", "visual-ready TIMEOUT");
        startupTrace("visual-ready (timeout)");
        finish("timeout");
      }
    }, VISUAL_READY_MAX_MS);
  });
}

/**
 * Keep native splash only until HTML/React painted a loading shell.
 * Does NOT wait for: auth, Supabase, dashboard, hardware, agent, or splash MIN/TARGET.
 */
export async function holdSplashUntilContentReady(options: {
  visualReady: Promise<"ready" | "timeout">;
}): Promise<void> {
  const visual = await options.visualReady;
  bootTrace("Renderer", `visual gate done (${visual})`);
  startupTrace(`visual-gate (${visual})`);
}

/**
 * Destroy splash immediately — no fade loop (keeps visual-ready → reveal under 100ms).
 */
export async function fadeAndDisposeSplash(splash: BrowserWindow | null) {
  if (!splash || splash.isDestroyed()) {
    destroySplashWindow(splash);
    return;
  }

  bootTrace("Splash", "destroy start");
  startupTrace("splash-destroy");
  destroySplashWindow(splash);
  bootTrace("Splash", "destroyed");
  perfLog("splash-disposed");
}
