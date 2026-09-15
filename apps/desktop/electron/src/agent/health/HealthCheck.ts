import { access, constants } from "node:fs/promises";
import { app } from "electron";
import { desktopConfig } from "../config/DesktopConfig.js";
import { desktopStatusManager } from "../status/DesktopLifecycleStatus.js";
import { getDesktopSupabase } from "../repository/supabaseClient.js";
import { realtimeListener } from "../RealtimeListener.js";
import { printerService } from "../../printer/printerService.js";

export interface HealthComponentStatus {
  ok: boolean;
  message?: string;
}

export interface HealthReport {
  supabase: HealthComponentStatus;
  realtime: HealthComponentStatus;
  printer: HealthComponentStatus;
  storage: HealthComponentStatus;
  internet: HealthComponentStatus;
  agentRegistration: HealthComponentStatus;
  checkedAt: string;
}

export class HealthCheck {
  private lastReport: HealthReport | null = null;

  getLastReport() {
    return this.lastReport;
  }

  async run(): Promise<HealthReport> {
    const [supabase, realtime, printer, storage, internet, agentRegistration] =
      await Promise.all([
        this.checkSupabase(),
        this.checkRealtime(),
        this.checkPrinter(),
        this.checkStorage(),
        this.checkInternet(),
        this.checkAgentRegistration(),
      ]);

    const report: HealthReport = {
      supabase,
      realtime,
      printer,
      storage,
      internet,
      agentRegistration,
      checkedAt: new Date().toISOString(),
    };

    this.lastReport = report;
    this.syncLifecycleStatus(report);

    return report;
  }

  isOnline() {
    const report = this.lastReport;
    if (!report) return desktopStatusManager.isOperational();
    return report.internet.ok && desktopStatusManager.isOperational();
  }

  isSupabaseConnected() {
    const report = this.lastReport;
    return report ? report.supabase.ok && report.realtime.ok : false;
  }

  private syncLifecycleStatus(report: HealthReport) {
    const current = desktopStatusManager.get();

    if (
      current === "STOPPED" ||
      current === "STARTING" ||
      current === "OFFLINE"
    ) {
      return;
    }

    const critical = [
      report.supabase,
      report.realtime,
      report.agentRegistration,
      report.internet,
    ];

    const allCriticalOk = critical.every((item) => item.ok);
    const anyCriticalFailed = critical.some((item) => !item.ok);

    if (allCriticalOk) {
      desktopStatusManager.set("ONLINE");
      return;
    }

    if (anyCriticalFailed) {
      desktopStatusManager.set("DEGRADED");
    }
  }

  private async checkSupabase(): Promise<HealthComponentStatus> {
    try {
      const supabase = getDesktopSupabase();
      const { error } = await supabase.from("desktop_agents").select("id").limit(1);

      if (error) {
        return { ok: false, message: error.message };
      }

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase indisponível";
      return { ok: false, message };
    }
  }

  private async checkRealtime(): Promise<HealthComponentStatus> {
    if (realtimeListener.isConnected()) {
      return { ok: true };
    }

    return { ok: false, message: "Canal Realtime não conectado" };
  }

  private async checkPrinter(): Promise<HealthComponentStatus> {
    const host = process.env.COSMO_PRINTER_HOST?.trim();

    if (!host) {
      return { ok: true, message: "Impressora em modo spooler/local" };
    }

    if (printerService.getQueueSize() >= 0) {
      return { ok: true };
    }

    return { ok: false, message: "Serviço de impressão indisponível" };
  }

  private async checkStorage(): Promise<HealthComponentStatus> {
    try {
      const userDataPath = app.getPath("userData");
      await access(userDataPath, constants.W_OK | constants.R_OK);
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Storage indisponível";
      return { ok: false, message };
    }
  }

  private async checkInternet(): Promise<HealthComponentStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sem conexão";
      return { ok: false, message };
    }
  }

  private async checkAgentRegistration(): Promise<HealthComponentStatus> {
    const agentId = desktopConfig.getAgentId();

    if (!agentId) {
      return { ok: false, message: "Agente não registrado" };
    }

    return { ok: true };
  }
}

export const healthCheck = new HealthCheck();
