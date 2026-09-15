import { createRequire } from "node:module";
import { app } from "electron";
import type { AppUpdater, UpdateInfo, ProgressInfo } from "electron-updater";
import { commandExecutor } from "../services/commandExecutor.js";
import {
  formatFeedLabel,
  resolveAllowPrerelease,
  resolveUpdaterFeed,
  toAutoUpdaterFeed,
  UPDATE_INITIAL_DELAY_MS,
  UPDATE_POLL_INTERVAL_MS,
} from "./updateConfig.js";
import {
  canInstallNow,
  createIdleUpdateStatus,
  isOfflineLikeError,
  isUpdaterFeedUnavailableError,
  mapProgress,
  phaseMessage,
  resolveUpdaterChannelName,
  sanitizeUpdaterUserError,
  shouldDeferUpdateCheck,
} from "./updateState.js";
import type {
  DesktopUpdateInstallRequest,
  DesktopUpdatePhase,
  DesktopUpdateStatus,
} from "./updateTypes.js";
import { updaterLog } from "./updaterLog.js";

const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater") as {
  autoUpdater: AppUpdater;
};

const BROADCAST_TYPE = "desktop-update";

export class AutoUpdaterService {
  private status: DesktopUpdateStatus = createIdleUpdateStatus({
    currentVersion: "0.0.0",
    packaged: false,
    feedUrl: formatFeedLabel(resolveUpdaterFeed()),
  });
  private listeners: Array<(available: boolean) => void> = [];
  private wired = false;
  private checksStarted = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastProgressAt = 0;

  initialize() {
    if (this.wired) return;
    this.wired = true;

    const feed = resolveUpdaterFeed(process.env, app.getVersion());
    this.status = createIdleUpdateStatus({
      currentVersion: app.getVersion(),
      packaged: app.isPackaged,
      feedUrl: formatFeedLabel(feed),
      provider: feed.provider,
    });

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.allowPrerelease = resolveAllowPrerelease(app.getVersion());

    const channelName = resolveUpdaterChannelName(app.getVersion());
    if (channelName) {
      autoUpdater.channel = channelName;
    }

    try {
      autoUpdater.setFeedURL(toAutoUpdaterFeed(feed));
    } catch (error) {
      updaterLog.warn("setFeedURL falhou — usando app-update.yml empacotado", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    autoUpdater.on("checking-for-update", () => {
      this.patch({
        phase: "checking",
        message: phaseMessage("checking"),
        error: null,
        lastCheckedAt: new Date().toISOString(),
      });
      updaterLog.info("checking");
    });

    autoUpdater.on("update-available", (info: UpdateInfo) => {
      const availableVersion = info?.version ?? null;
      this.patch({
        phase: "available",
        availableVersion,
        message: phaseMessage("available", availableVersion),
        error: null,
        progress: null,
      });
      this.notifyLegacy();
      updaterLog.info(`update-available=${availableVersion ?? "unknown"}`);
    });

    autoUpdater.on("update-not-available", () => {
      this.patch({
        phase: "up-to-date",
        availableVersion: null,
        message: phaseMessage("up-to-date"),
        error: null,
        progress: null,
      });
      this.notifyLegacy();
      updaterLog.info("update-not-available");
    });

    autoUpdater.on("download-progress", (progress: ProgressInfo) => {
      const mapped = mapProgress(progress);
      const now = Date.now();
      if (now - this.lastProgressAt < 250 && mapped.percent < 99) return;
      this.lastProgressAt = now;
      this.patch({
        phase: "downloading",
        progress: mapped,
        message: phaseMessage("downloading"),
        error: null,
      });
    });

    autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
      const availableVersion =
        info?.version ?? this.status.availableVersion ?? null;
      this.patch({
        phase: "downloaded",
        availableVersion,
        progress: mapProgress({ percent: 100 }),
        message: phaseMessage("downloaded"),
        error: null,
      });
      this.notifyLegacy();
      updaterLog.info("download concluído", { availableVersion });
    });

    autoUpdater.on("error", (error: Error) => {
      const message = error?.message ?? String(error);
      if (isOfflineLikeError(message)) {
        updaterLog.warn("check/download offline — silencioso", {
          error: message,
        });
        if (
          this.status.phase === "checking" ||
          this.status.phase === "downloading"
        ) {
          this.patch({
            phase: this.status.availableVersion ? "available" : "idle",
            message: "",
            error: null,
          });
        }
        return;
      }
      if (isUpdaterFeedUnavailableError(message)) {
        updaterLog.error(
          "feed GitHub inacessível publicamente — releases.atom retornou 404. " +
            "Confirme que cosmoaistudio/cosmo-business-ai está público e possui Release publicada.",
          { error: message }
        );
      } else {
        updaterLog.error(`error=${message}`);
      }
      this.patch({
        phase: "error",
        error: sanitizeUpdaterUserError(message),
        message: phaseMessage("error"),
      });
    });

    updaterLog.info("initialized");
    updaterLog.info(`provider=${feed.provider}`);
    if (feed.provider === "github") {
      updaterLog.info(`owner=${feed.owner}`);
      updaterLog.info(`repo=${feed.repo}`);
    }
    updaterLog.info(`current-version=${app.getVersion()}`);
    updaterLog.info(`allowPrerelease=${autoUpdater.allowPrerelease}`);
    if (channelName) {
      updaterLog.info(`channel=${channelName}`);
    }
  }

  /**
   * Starts background checks after the UI is already up.
   * Safe to call more than once.
   */
  startBackgroundChecks() {
    if (this.checksStarted) return;
    this.checksStarted = true;

    if (!app.isPackaged) {
      updaterLog.info("Dev mode — verificação automática ignorada");
      return;
    }

    setTimeout(() => {
      void this.checkForUpdates();
    }, UPDATE_INITIAL_DELAY_MS);

    this.pollTimer = setInterval(() => {
      void this.checkForUpdates();
    }, UPDATE_POLL_INTERVAL_MS);
  }

  getStatus(): DesktopUpdateStatus {
    return { ...this.status };
  }

  isUpdateAvailable() {
    return (
      this.status.phase === "available" ||
      this.status.phase === "downloading" ||
      this.status.phase === "downloaded"
    );
  }

  async checkForUpdates() {
    this.initialize();

    if (shouldDeferUpdateCheck(this.status.phase) || this.status.installOnQuit) {
      return { ok: true, data: this.getStatus() };
    }

    if (!app.isPackaged) {
      this.patch({
        phase: "up-to-date",
        message: "Modo desenvolvimento — atualização remota desativada.",
        error: null,
      });
      return { ok: true, data: this.getStatus() };
    }

    try {
      updaterLog.info("checking");
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, data: result ? this.getStatus() : this.getStatus() };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao verificar atualizações";
      if (isOfflineLikeError(message)) {
        updaterLog.warn("check offline", { error: message });
        this.patch({
          phase: this.status.availableVersion ? "available" : "idle",
          message: "",
          error: null,
        });
        return { ok: true, data: this.getStatus() };
      }
      if (isUpdaterFeedUnavailableError(message)) {
        updaterLog.error(
          "feed GitHub inacessível publicamente — releases.atom retornou 404.",
          { error: message }
        );
      }
      this.patch({
        phase: "error",
        error: sanitizeUpdaterUserError(message),
        message: phaseMessage("error"),
      });
      return {
        ok: false,
        error: sanitizeUpdaterUserError(message),
        data: this.getStatus(),
      };
    }
  }

  async downloadUpdate() {
    this.initialize();

    if (!app.isPackaged) {
      return { ok: false, error: "Atualização disponível apenas no app instalado." };
    }

    if (this.status.phase === "downloaded") {
      return { ok: true, data: this.getStatus() };
    }

    if (this.status.phase === "downloading") {
      return { ok: true, data: this.getStatus() };
    }

    try {
      updaterLog.info("download iniciado");
      this.patch({
        phase: "downloading",
        progress: mapProgress({ percent: 0 }),
        message: phaseMessage("downloading"),
        error: null,
      });
      await autoUpdater.downloadUpdate();
      return { ok: true, data: this.getStatus() };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao baixar atualização";
      if (isOfflineLikeError(message)) {
        updaterLog.warn("download offline", { error: message });
        this.patch({
          phase: "available",
          message: phaseMessage("available", this.status.availableVersion),
          error: null,
        });
        return { ok: false, error: "Sem conexão para baixar a atualização." };
      }
      this.patch({
        phase: "error",
        error: sanitizeUpdaterUserError(message),
        message: phaseMessage("error"),
      });
      return { ok: false, error: sanitizeUpdaterUserError(message) };
    }
  }

  async installUpdate(request: DesktopUpdateInstallRequest = { when: "now" }) {
    const when = request.when === "quit" ? "quit" : "now";
    const gate = canInstallNow({
      phase: this.status.phase,
      criticalOperation: Boolean(request.criticalOperation),
      when,
      criticalReason: request.criticalReason,
    });

    if (!gate.ok) {
      updaterLog.warn("instalação recusada", { reason: gate.reason, when });
      return { ok: false, error: gate.reason, data: this.getStatus() };
    }

    if (when === "quit") {
      autoUpdater.autoInstallOnAppQuit = true;
      this.patch({
        installOnQuit: true,
        message: "A atualização será instalada ao fechar o Cosmo Business.",
      });
      updaterLog.info("instalação ao fechar");
      return { ok: true, data: this.getStatus() };
    }

    this.patch({
      phase: "installing",
      message: phaseMessage("installing"),
    });
    updaterLog.info("instalação iniciada");
    autoUpdater.quitAndInstall(false, true);
    return { ok: true, data: this.getStatus() };
  }

  dismiss() {
    if (this.status.phase === "available" || this.status.phase === "error") {
      this.patch({
        phase: "idle",
        message: "",
        error: null,
      });
    }
    return { ok: true, data: this.getStatus() };
  }

  onChange(listener: (available: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  private patch(partial: Partial<DesktopUpdateStatus>) {
    this.status = { ...this.status, ...partial };
    this.broadcast();
  }

  private broadcast() {
    try {
      commandExecutor.broadcast(BROADCAST_TYPE, this.getStatus());
    } catch {
      /* window may not be registered yet */
    }
  }

  private notifyLegacy() {
    for (const listener of this.listeners) {
      listener(this.isUpdateAvailable());
    }
  }
}

export const autoUpdaterService = new AutoUpdaterService();

export function isUpdaterBroadcast(type: string) {
  return type === BROADCAST_TYPE;
}

export type { DesktopUpdatePhase, DesktopUpdateStatus };
