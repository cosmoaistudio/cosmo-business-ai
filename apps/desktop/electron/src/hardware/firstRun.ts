import { promises as fs } from "node:fs";
import { BrowserWindow, ipcMain } from "electron";
import { getAssetPath, getFirstRunStatePath } from "../config/storePaths.js";
import { listWindowsPrinters, listComPorts } from "./windowsDevices.js";
import { scaleManager } from "./scale/scaleManager.js";
import type { BusinessType, FirstRunCompany, FirstRunState } from "./types.js";
import { resolvePreloadPath } from "../main/paths.js";
import { bootError, bootLog, bootWarn } from "../main/bootstrapLog.js";

const EMPTY: FirstRunState = {
  completed: false,
  completedAt: null,
  company: null,
  businessType: null,
};

export async function readFirstRunState(): Promise<FirstRunState> {
  try {
    const raw = await fs.readFile(getFirstRunStatePath(), "utf8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export async function writeFirstRunState(state: FirstRunState) {
  await fs.writeFile(
    getFirstRunStatePath(),
    JSON.stringify(state, null, 2),
    "utf8"
  );
  return state;
}

export type FirstRunWizardOptions = {
  /** Parent main window — wizard is independent; closing never blocks dashboard. */
  parent?: BrowserWindow | null;
};

/**
 * Wizard de primeira execução — independente da Splash.
 * Se o usuário fechar, resolve e o Dashboard já deve estar aberto.
 */
export async function runFirstRunWizardIfNeeded(
  options: FirstRunWizardOptions = {}
): Promise<FirstRunState> {
  const current = await readFirstRunState();
  if (current.completed) {
    bootLog("Wizard ignorado (já concluído)");
    return current;
  }

  bootLog("Wizard de primeira execução");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (state: FirstRunState) => {
      if (settled) return;
      settled = true;
      resolve(state);
    };

    const parent =
      options.parent && !options.parent.isDestroyed()
        ? options.parent
        : undefined;

    const win = new BrowserWindow({
      width: 720,
      height: 640,
      parent,
      modal: Boolean(parent),
      show: false,
      autoHideMenuBar: true,
      title: "Cosmo Business — Primeira execução",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: resolvePreloadPath("firstRunPreload"),
      },
    });

    const htmlPath = getAssetPath("first-run.html");
    void win.loadFile(htmlPath).catch((error) => {
      bootError("Wizard loadFile falhou", error);
      cleanup();
      if (!win.isDestroyed()) win.destroy();
      finish(current);
    });

    const onComplete = async (
      _event: Electron.IpcMainInvokeEvent,
      payload: {
        company: FirstRunCompany;
        businessType: BusinessType;
        skip?: boolean;
      }
    ) => {
      try {
        const next: FirstRunState = {
          completed: true,
          completedAt: new Date().toISOString(),
          company: payload.skip ? current.company : payload.company,
          businessType: payload.skip
            ? current.businessType
            : payload.businessType,
        };
        await writeFirstRunState(next);
        bootLog("Wizard concluído");
        cleanup();
        if (!win.isDestroyed()) win.close();
        finish(next);
      } catch (error) {
        bootError("Wizard falhou ao salvar", error);
        cleanup();
        if (!win.isDestroyed()) win.close();
        finish(current);
      }
    };

    const onDetect = async () => {
      try {
        const printers = await listWindowsPrinters();
        const ports = await listComPorts();
        const scales = scaleManager.getCapabilities();
        return {
          printers,
          ports,
          scales,
          desktopAgent: "Desktop Agent process is the Electron main process",
        };
      } catch (error) {
        bootWarn("Detect hardware falhou (opcional)", error);
        return { printers: [], ports: [], scales: [], error: String(error) };
      }
    };

    const cleanup = () => {
      ipcMain.removeHandler("cosmo:first-run:complete");
      ipcMain.removeHandler("cosmo:first-run:detect-hardware");
    };

    ipcMain.handle("cosmo:first-run:complete", onComplete);
    ipcMain.handle("cosmo:first-run:detect-hardware", onDetect);

    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) win.show();
    });

    win.on("closed", () => {
      cleanup();
      bootWarn("Wizard fechado pelo usuário — abrindo Dashboard normalmente");
      void readFirstRunState().then(finish);
    });
  });
}
