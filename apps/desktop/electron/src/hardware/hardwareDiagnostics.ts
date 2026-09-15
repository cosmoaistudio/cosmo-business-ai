import { app } from "electron";
import { healthCheck } from "../agent/health/HealthCheck.js";
import { DesktopSecretManager } from "../agent/config/DesktopSecretManager.js";
import { desktopStatusManager } from "../agent/index.js";
import { printManager } from "./printManager.js";
import { scaleManager } from "./scale/scaleManager.js";
import { listComPorts } from "./windowsDevices.js";
import type { HardwareDiagnosticsSnapshot } from "./types.js";

export async function runHardwareDiagnostics(): Promise<HardwareDiagnosticsSnapshot> {
  await healthCheck.run();
  const agentProbe = DesktopSecretManager.probe();
  const printers = await printManager.detectPrinters();
  const comPorts = await listComPorts();

  return {
    checkedAt: new Date().toISOString(),
    version: app.getVersion(),
    electron: process.versions.electron ?? "unknown",
    desktopAgent: {
      status: desktopStatusManager.get(),
      detail: agentProbe.configured
        ? agentProbe.message
        : "Standby / modo local — secrets não configurados",
    },
    internet: {
      ok: healthCheck.isOnline(),
      detail: healthCheck.isOnline() ? "Online" : "Offline",
    },
    supabase: {
      ok: healthCheck.isSupabaseConnected(),
      detail: healthCheck.isSupabaseConnected()
        ? "Conectado"
        : "Sem sessão/agent Supabase",
    },
    printers,
    scales: scaleManager.getCapabilities(),
    comPorts,
    usbHint:
      "Dispositivos USB aparecem como impressoras Windows ou portas COM (USB Serial). Use o Gerenciador de Dispositivos do Windows para detalhes HID.",
  };
}
