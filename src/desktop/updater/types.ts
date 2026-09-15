export type DesktopUpdatePhase =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "error";

export type DesktopUpdateInstallWhen = "now" | "quit";

export type DesktopUpdateChannel = "prerelease" | "stable";

export type DesktopUpdateProvider = "github" | "generic";

export interface DesktopUpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface DesktopUpdateStatus {
  phase: DesktopUpdatePhase;
  currentVersion: string;
  availableVersion: string | null;
  progress: DesktopUpdateProgress | null;
  message: string;
  error: string | null;
  packaged: boolean;
  feedUrl: string;
  installOnQuit: boolean;
  lastCheckedAt: string | null;
  provider: DesktopUpdateProvider;
  channel: DesktopUpdateChannel;
}

export function isVisibleUpdatePhase(phase: DesktopUpdatePhase): boolean {
  return (
    phase === "available" ||
    phase === "downloading" ||
    phase === "downloaded" ||
    phase === "error"
  );
}

export function formatDownloadSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "";
  const kb = bytesPerSecond / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB/s`;
  return `${(kb / 1024).toFixed(1)} MB/s`;
}

export function formatLastCheckedAt(iso: string | null | undefined): string {
  if (!iso) return "Ainda não verificada";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Ainda não verificada";
  return date.toLocaleString("pt-BR");
}

export function updatePhaseLabel(phase: DesktopUpdatePhase): string {
  switch (phase) {
    case "checking":
      return "Verificando atualizações…";
    case "up-to-date":
      return "Você está usando a versão mais recente.";
    case "available":
      return "Nova atualização disponível";
    case "downloading":
      return "Baixando atualização…";
    case "downloaded":
      return "Atualização pronta para instalar.";
    case "installing":
      return "Instalando atualização…";
    case "error":
      return "Não foi possível atualizar agora.";
    default:
      return "Nenhuma atualização pendente.";
  }
}

export function updateChannelLabel(channel: DesktopUpdateChannel): string {
  return channel === "prerelease" ? "Pre-release" : "Stable";
}

export function updateServerLabel(provider: DesktopUpdateProvider): string {
  return provider === "generic" ? "Servidor local de teste" : "GitHub Releases";
}

export function updateDiagnosticStatus(phase: DesktopUpdatePhase): string {
  switch (phase) {
    case "checking":
      return "Verificando";
    case "up-to-date":
      return "Atualizado";
    case "available":
    case "downloading":
    case "downloaded":
    case "installing":
      return "Atualização disponível";
    case "error":
      return "Erro";
    default:
      return "Aguardando";
  }
}

export function resolveRendererUpdateChannel(
  version: string
): DesktopUpdateChannel {
  return /-[a-z0-9]/i.test(version.trim()) ? "prerelease" : "stable";
}

export const UPDATER_USER_ERROR_MESSAGE =
  "Não foi possível verificar atualizações agora. Verifique sua conexão e tente novamente.";

export function sanitizeRendererUpdaterError(
  message: string | null | undefined
): string | null {
  const text = (message ?? "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (
    lower.includes("404") ||
    lower.includes("releases.atom") ||
    lower.includes("method: get url:") ||
    lower.includes("authentication token") ||
    lower.includes("set-cookie") ||
    lower.includes("_gh_sess") ||
    lower.includes("net::err") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    text.length > 160
  ) {
    return UPDATER_USER_ERROR_MESSAGE;
  }
  return text;
}
