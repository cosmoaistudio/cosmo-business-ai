import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow } from "electron";
import { bootError, bootLog } from "./bootstrapLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createSplashWindow() {
  const splash = new BrowserWindow({
    width: 520,
    height: 420,
    frame: false,
    transparent: false,
    backgroundColor: "#020617",
    alwaysOnTop: true,
    center: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const splashPath = path.join(__dirname, "../assets/splash.html");
  bootLog("Splash criada", splashPath);

  void splash.loadFile(splashPath).catch((error) => {
    bootError("Splash loadFile falhou", error);
  });

  splash.once("ready-to-show", () => {
    if (!splash.isDestroyed()) {
      splash.show();
      bootLog("Splash exibida");
    }
  });

  return splash;
}

/**
 * Fecha e destrói a splash. Nunca deixa a janela residual aberta.
 */
export function destroySplashWindow(splash: BrowserWindow | null) {
  if (splash && !splash.isDestroyed()) {
    try {
      splash.close();
      splash.destroy();
      bootLog("Splash.close() + destroy()");
    } catch (error) {
      bootError("Erro ao fechar/destruir splash", error);
    }
  }

  if (splash && !splash.isDestroyed()) {
    try {
      splash.destroy();
      bootLog("Splash.destroy() forçado");
    } catch (error) {
      bootError("Erro ao forçar destroy da splash", error);
    }
  }
}
