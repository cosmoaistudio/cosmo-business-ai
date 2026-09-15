import { supabase } from "@/config/supabase";
import type {
  DiagnosticCheck,
  DiagnosticsSnapshot,
  DiagnosticStatus,
} from "../types/diagnostics";

function statusFromOk(ok: boolean, degraded = false): DiagnosticStatus {
  if (ok) return degraded ? "degraded" : "ok";
  return "down";
}

/**
 * Diagnóstico client-side. Não altera Auth/DB; apenas lê saúde.
 */
export const diagnosticsService = {
  async getSnapshot(): Promise<DiagnosticsSnapshot> {
    const checks: DiagnosticCheck[] = [];

    const online = typeof navigator !== "undefined" ? navigator.onLine : true;
    checks.push({
      id: "internet",
      label: "Internet",
      status: statusFromOk(online),
      detail: online ? "Conexão disponível" : "Sem conexão detectada",
    });

    let supabaseOk = false;
    let supabaseDetail = "Não verificado";
    try {
      const { error } = await supabase.auth.getSession();
      supabaseOk = !error;
      supabaseDetail = error
        ? error.message
        : "Sessão Supabase acessível";
    } catch (error) {
      supabaseDetail =
        error instanceof Error ? error.message : "Falha ao contatar Supabase";
    }

    checks.push({
      id: "supabase",
      label: "Supabase",
      status: statusFromOk(supabaseOk),
      detail: supabaseDetail,
    });

    checks.push({
      id: "database",
      label: "Banco",
      status: statusFromOk(supabaseOk, !supabaseOk),
      detail: supabaseOk
        ? "Acesso via Supabase (client)"
        : "Indisponível enquanto Supabase falhar",
    });

    const desktopAgent =
      typeof window !== "undefined" &&
      Boolean((window as Window & { cosmoDesktop?: unknown }).cosmoDesktop);

    checks.push({
      id: "desktop-agent",
      label: "Desktop Agent",
      status: desktopAgent ? "ok" : "unknown",
      detail: desktopAgent
        ? "Bridge Electron detectada"
        : "Rodando no browser ou agent não carregado",
    });

    const appVersion =
      (typeof import.meta !== "undefined" &&
        (import.meta.env.VITE_APP_VERSION as string | undefined)) ||
      "1.0.0";

    const buildMode =
      typeof import.meta !== "undefined" ? import.meta.env.MODE : "unknown";

    checks.push({
      id: "version",
      label: "Versão",
      status: "ok",
      detail: appVersion,
    });

    checks.push({
      id: "build",
      label: "Build",
      status: "ok",
      detail: buildMode,
    });

    return {
      checkedAt: new Date().toISOString(),
      appVersion,
      buildMode,
      checks,
    };
  },
};
