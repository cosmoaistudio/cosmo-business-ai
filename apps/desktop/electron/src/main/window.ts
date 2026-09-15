import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, shell } from "electron";
import { attachRendererDiagnostics, bootError, bootLog } from "./bootstrapLog.js";
import { bootTrace, startupTrace } from "./bootTiming.js";
import { resolvePreloadPath } from "./paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Packaged always uses loadFile. Dev only when explicitly using Vite. */
function useDevServer() {
  return (
    !app.isPackaged &&
    Boolean(process.env.VITE_DEV_SERVER_URL) &&
    process.env.NODE_ENV === "development"
  );
}

function resolveAppBootHtml() {
  return path.join(__dirname, "../assets/app-boot.html");
}

/**
 * Singleton MainWindow — Login/Dashboard are React routes inside this window.
 * Never create a second Main/Auth/Login BrowserWindow.
 */
let mainWindowSingleton: BrowserWindow | null = null;

export function getMainWindow() {
  if (mainWindowSingleton && mainWindowSingleton.isDestroyed()) {
    mainWindowSingleton = null;
  }
  return mainWindowSingleton;
}

export function createMainWindow() {
  const existing = getMainWindow();
  if (existing) {
    bootLog("MainWindow reutilizada (singleton) — sem segunda janela");
    return existing;
  }

  const preloadPath = resolvePreloadPath("index");
  const iconPath = path.join(__dirname, "../assets/icon.png");

  bootLog("Main criada", `preload=${preloadPath}`);
  bootTrace("Window", "BrowserWindow created");
  startupTrace("MainWindow created");

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    title: "Cosmo Business",
    icon: iconPath,
    backgroundColor: "#020617",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath,
    },
  });

  mainWindowSingleton = window;

  window.on("closed", () => {
    if (mainWindowSingleton === window) {
      mainWindowSingleton = null;
    }
  });

  attachRendererDiagnostics(window);

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("dom-ready", () => {
    bootTrace("Load", "dom-ready");
    startupTrace("dom-ready");
  });

  window.webContents.on("did-finish-load", () => {
    bootTrace("Load", "did-finish-load");
    startupTrace("did-finish-load");
  });

  /**
   * Instant local shell first — visual-ready must not wait on Vite/React/auth.
   * Real app URL is loaded after splash reveal via navigateMainWindowToApp().
   */
  const bootHtml = resolveAppBootHtml();
  bootLog("Main loadFile (boot shell)", bootHtml);
  bootTrace("Load", "loadFile start", bootHtml);
  startupTrace("loadFile", "app-boot.html");
  void window.loadFile(bootHtml).catch((error) => {
    // navigateMainWindowToApp() may abort this navigation after visual-ready — ignore
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ERR_ABORTED")) return;
    bootError("Main loadFile (boot) rejeitou", error);
  });

  return window;
}

/**
 * After splash reveal: navigate the same MainWindow to Vite (dev) or dist (prod).
 * Previous boot shell stays painted until the next document is ready.
 */
export function navigateMainWindowToApp(window: BrowserWindow | null) {
  if (!window || window.isDestroyed()) return;

  if (useDevServer()) {
    const url = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
    bootLog("Main loadURL (dev app)", url);
    bootTrace("Load", "loadURL start", url);
    startupTrace("loadURL", url);
    void window.loadURL(url).catch((error) => {
      bootError("Main loadURL rejeitou", error);
    });
    if (process.env.COSMO_DEVTOOLS === "1") {
      window.webContents.openDevTools({ mode: "right" });
    }
    return;
  }

  const indexHtml = path.join(app.getAppPath(), "dist/index.html");
  bootLog("Main loadFile (app)", indexHtml);
  bootTrace("Load", "loadFile start", indexHtml);
  startupTrace("loadFile", indexHtml);
  void window.loadFile(indexHtml).catch((error) => {
    bootError("Main loadFile rejeitou", error);
  });
}

/**
 * Wait until the renderer finished loading — does NOT show the window.
 * Splash remains the only visible window until revealMainWindow().
 */
export function waitForMainWindowReady(
  window: BrowserWindow,
  timeoutMs = 20_000
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (reason: string) => {
      if (settled) return;
      settled = true;
      bootLog("MainWindow renderer-ready (hidden)", reason);
      bootTrace("Load", `renderer document ready (${reason})`);
      resolve();
    };

    if (window.isDestroyed()) {
      resolve();
      return;
    }

    if (!window.webContents.isLoading() && window.webContents.getURL()) {
      finish("already-loaded");
      return;
    }

    window.once("ready-to-show", () => finish("ready-to-show"));

    window.webContents.once("did-finish-load", () => {
      if (!settled) {
        setTimeout(() => {
          if (!settled) finish("did-finish-load");
        }, 0);
      }
    });

    window.webContents.once("did-fail-load", (_e, code, desc) => {
      bootError("MainWindow did-fail-load", `${code} ${desc}`);
      finish("did-fail-load");
    });

    setTimeout(() => {
      if (!settled) {
        console.warn(
          "[Cosmo Desktop] ⚠ Timeout aguardando document — liberando gate de load."
        );
        finish("timeout");
      }
    }, timeoutMs);
  });
}

/** Show MainWindow only after splash is gone — never alongside Splash. */
export function revealMainWindow(window: BrowserWindow | null) {
  if (!window || window.isDestroyed()) return;
  if (!window.isVisible()) {
    window.show();
  }
  if (window.isMinimized()) {
    window.restore();
  }
  window.focus();
  bootLog("MainWindow.show() — reveal após splash");
  bootTrace("Window", "revealed");
  startupTrace("main-reveal");
}

export function focusMainWindow() {
  const window = getMainWindow();
  if (!window) return false;
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
  return true;
}
