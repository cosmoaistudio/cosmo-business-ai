import { app, BrowserWindow, dialog } from "electron";
import { registerIpcHandlers } from "../ipc/handlers.js";
import { commandExecutor } from "../services/commandExecutor.js";
import { offlineSyncService } from "../services/offlineSyncService.js";
import { printerService } from "../printer/printerService.js";
import { printManager } from "../hardware/printManager.js";
import { scaleManager } from "../hardware/scale/scaleManager.js";
import { runFirstRunWizardIfNeeded } from "../hardware/firstRun.js";
import { autoUpdaterService } from "../updater/autoUpdaterService.js";
import { createSplashWindow, destroySplashWindow } from "./splash.js";
import {
  fadeAndDisposeSplash,
  holdSplashUntilContentReady,
  waitForRendererVisualReady,
} from "./splashTiming.js";
import {
  createMainWindow,
  focusMainWindow,
  getMainWindow,
  navigateMainWindowToApp,
  revealMainWindow,
  waitForMainWindowReady,
} from "./window.js";
import { bootError, bootLog, bootWarn } from "./bootstrapLog.js";
import { markBootOrigin, bootTrace, startupTrace } from "./bootTiming.js";
import { perfLog } from "./perfLog.js";
import {
  deliverAuthCallbackUrl,
  findCosmoOAuthUrlInArgv,
  registerCosmoOAuthProtocolClient,
} from "./oauthProtocol.js";
import { ensureOAuthLandingServer, stopOAuthLandingServer } from "./oauthLandingServer.js";
import {
  desktopAgent,
  DesktopSecretManager,
  DESKTOP_LIFECYCLE_STATUS,
  desktopStatusManager,
} from "../agent/index.js";

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let bootStarted = false;

/** Cold-start deep link (Windows passes protocol URL in argv). */
const coldStartOAuthUrl = findCosmoOAuthUrlInArgv(process.argv);
if (coldStartOAuthUrl) {
  deliverAuthCallbackUrl(coldStartOAuthUrl);
}

/** Refuse duplicate Cosmo processes (prevents Login + Dashboard as two apps). */
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  console.warn(
    "[Cosmo Desktop] ⚠ Outra instância já está aberta — encerrando este processo."
  );
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    bootLog("second-instance — focando MainWindow existente");
    const oauthUrl = findCosmoOAuthUrlInArgv(argv);
    if (oauthUrl) {
      deliverAuthCallbackUrl(oauthUrl);
    }
    if (!focusMainWindow()) {
      // Extreme recovery: recreate singleton only if nothing exists
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
        commandExecutor.registerWindow(mainWindow);
        void waitForMainWindowReady(mainWindow).then(() => {
          revealMainWindow(mainWindow);
        });
      }
    }
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    deliverAuthCallbackUrl(url);
  });
}

async function disposeSplash() {
  await fadeAndDisposeSplash(splashWindow);
  splashWindow = null;
}

function disposeSplashSync() {
  destroySplashWindow(splashWindow);
  splashWindow = null;
}

/**
 * Destroy any non-main, non-splash BrowserWindows (stale auth shells, orphans).
 * First-run wizard is allowed only after Main is revealed (created later).
 */
function destroyOrphanAppWindows(allowWizard = false) {
  const main = getMainWindow();
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue;
    if (main && win.id === main.id) continue;
    if (splashWindow && !splashWindow.isDestroyed() && win.id === splashWindow.id) {
      continue;
    }
    const title = win.getTitle() || "";
    if (allowWizard && title.includes("Primeira execução")) continue;
    bootWarn("Destruindo janela órfã", `id=${win.id} title=${title}`);
    try {
      win.close();
      win.destroy();
    } catch (error) {
      bootWarn("Falha ao destruir janela órfã", error);
    }
  }
}

/**
 * Serviços locais opcionais — nunca bloqueiam abertura da MainWindow.
 */
async function bootstrapOptionalLocalServices() {
  const userDataPath = app.getPath("userData");

  await printerService.initialize(userDataPath).catch((error) => {
    bootWarn("printerService.initialize (opcional)", error);
  });
  await printManager.initialize(userDataPath).catch((error) => {
    bootWarn("printManager.initialize (opcional)", error);
  });
  await scaleManager.initialize().catch((error) => {
    bootWarn("scaleManager.initialize (opcional)", error);
  });
  await offlineSyncService.initialize(userDataPath).catch((error) => {
    bootWarn("offlineSyncService.initialize (opcional)", error);
  });

  try {
    autoUpdaterService.initialize();
    autoUpdaterService.startBackgroundChecks();
    bootLog("Auto-updater preparado (check em segundo plano)");
  } catch (error) {
    bootWarn("autoUpdater (opcional)", error);
  }
}

async function startDesktopAgentOptional() {
  const status = DesktopSecretManager.probe();

  if (!status.configured) {
    desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.STOPPED);
    bootLog("Desktop Agent em standby (modo local)");
    return;
  }

  try {
    await desktopAgent.start();
    bootLog("Desktop Agent iniciado");
  } catch (error) {
    desktopStatusManager.set(DESKTOP_LIFECYCLE_STATUS.STOPPED);
    bootWarn("Desktop Agent não iniciado — modo local", error);
    const parent = getMainWindow();
    if (parent && !parent.isDestroyed()) {
      await dialog.showMessageBox(parent, {
        type: "info",
        title: "Cosmo Business",
        message: "Modo local ativo",
        detail:
          "O controle remoto não pôde ser iniciado neste momento.\n\n" +
          "O Cosmo continuará funcionando normalmente.\n\n" +
          "Consulte docs/DESKTOP_AGENT_SETUP.md para revisar a configuração.",
        buttons: ["Continuar"],
        defaultId: 0,
        noLink: true,
      });
    }
  }
}

async function ensureMainWindowReady() {
  mainWindow = createMainWindow();
  commandExecutor.registerWindow(mainWindow);
  await waitForMainWindowReady(mainWindow);
  revealMainWindow(mainWindow);
}

/**
 * BOOT → NATIVE SPLASH (única visível)
 *     → MainWindow hidden + IPC
 *     → visual-ready (boot shell HTML / loading shell — NOT auth)
 *     → destroy Splash immediately
 *     → reveal MainWindow
 *     → auth/session/dashboard em paralelo
 */
async function createApplication() {
  if (bootStarted) {
    bootWarn("createApplication ignorado — boot já em andamento/concluído");
    return;
  }
  bootStarted = true;

  markBootOrigin();
  perfLog("startup");
  bootTrace("Boot", "Electron started");
  startupTrace("Electron start");
  bootLog(
    "Electron iniciado",
    `packaged=${app.isPackaged} version=${app.getVersion()}`
  );

  splashWindow = createSplashWindow();
  bootTrace("Splash", "native splash created");
  startupTrace("native-splash created");

  let initError: unknown = null;

  try {
    // Listen BEFORE loadURL — boot shell may signal before did-finish-load
    const visualReady = waitForRendererVisualReady();

    mainWindow = createMainWindow();
    perfLog("main-window-created");
    commandExecutor.registerWindow(mainWindow);

    registerIpcHandlers();
    bootLog("IPC registrado — bridge/preload-ready");
    bootTrace("Boot", "bridge/preload ready");
    perfLog("bridge-ready");

    // Boot shell load is informational — splash releases on visual-ready only
    void waitForMainWindowReady(mainWindow).then(() => {
      startupTrace("renderer-ready");
    });

    // Release as soon as local boot shell painted (not auth / not Vite)
    await holdSplashUntilContentReady({ visualReady });

    await disposeSplash();
    destroyOrphanAppWindows(false);

    revealMainWindow(mainWindow);
    perfLog("app-ready");
    bootTrace("Boot", "app-ready (Main revealed with visual content)");
    bootLog("MainWindow revelada — Auth/Dashboard via rota React");

    // Navigate to Vite/dist AFTER reveal — previous shell stays until next paint
    navigateMainWindowToApp(mainWindow);

    // Re-deliver buffered OAuth deep link once MainWindow exists
    if (coldStartOAuthUrl) {
      deliverAuthCallbackUrl(coldStartOAuthUrl);
    }

    // Hardware/agent/updater must never block first paint
    void bootstrapOptionalLocalServices().catch((error) => {
      bootWarn("bootstrapOptionalLocalServices", error);
    });

    void startDesktopAgentOptional().catch((error) => {
      bootWarn("startDesktopAgentOptional", error);
    });

    try {
      await runFirstRunWizardIfNeeded({ parent: mainWindow });
    } catch (error) {
      bootWarn("Wizard falhou — Dashboard permanece aberto", error);
    }
  } catch (error) {
    initError = error;
    bootError("Falha na inicialização — recuperando", error);
    await disposeSplash();
    try {
      await ensureMainWindowReady();
    } catch (windowError) {
      bootError("Não foi possível abrir a MainWindow", windowError);
    }
  } finally {
    await disposeSplash();
    destroyOrphanAppWindows(true);
  }

  if (initError) {
    const message =
      initError instanceof Error ? initError.message : String(initError);
    const parent = getMainWindow() ?? undefined;
    const boxOpts = {
      type: "error" as const,
      title: "Cosmo Business",
      message: "Falha na inicialização",
      detail:
        "Ocorreu um erro ao iniciar alguns serviços.\n\n" +
        "A aplicação será aberta normalmente.\n\n" +
        message,
      buttons: ["OK"],
      defaultId: 0,
      noLink: true,
    };
    if (parent && !parent.isDestroyed()) {
      await dialog.showMessageBox(parent, boxOpts);
    } else {
      await dialog.showMessageBox(boxOpts);
    }
  }
}

if (gotSingleInstanceLock) {
  // Must run before ready on some platforms; safe to call again after ready.
  registerCosmoOAuthProtocolClient();

  app.whenReady().then(() => {
    registerCosmoOAuthProtocolClient();
    void ensureOAuthLandingServer().catch((error) => {
      bootWarn("OAuth landing server (opcional)", error);
    });

    void createApplication().catch((error) => {
      bootError("createApplication rejeitou", error);
      disposeSplashSync();
      void ensureMainWindowReady().catch((windowError) => {
        bootError("Fallback MainWindow falhou", windowError);
      });
    });

    app.on("activate", () => {
      if (!focusMainWindow()) {
        mainWindow = createMainWindow();
        commandExecutor.registerWindow(mainWindow);
        void waitForMainWindowReady(mainWindow).then(() => {
          revealMainWindow(mainWindow);
        });
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    stopOAuthLandingServer();
    void printerService.shutdown();
    void offlineSyncService.shutdown();
    void desktopAgent.shutdown();
    void scaleManager.disconnect();
  });

  process.on("uncaughtException", (error) => {
    bootError("uncaughtException", error);
  });

  process.on("unhandledRejection", (reason) => {
    bootError("unhandledRejection", reason);
  });
}
