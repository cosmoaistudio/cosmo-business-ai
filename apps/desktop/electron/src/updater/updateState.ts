import type {
  DesktopUpdateInstallWhen,
  DesktopUpdatePhase,
  DesktopUpdateProgress,
  DesktopUpdateStatus,
} from "./updateTypes.js";

const OFFLINE_HINTS = [
  "enotfound",
  "enetunreach",
  "econnrefused",
  "econnreset",
  "etimedout",
  "enotconn",
  "net::err",
  "offline",
  "getaddrinfo",
  "failed to fetch",
  "network",
];

const FEED_UNAVAILABLE_HINTS = [
  "404",
  "releases.atom",
  "not found",
  "authentication token",
  "err_updater",
  "cannot parse releases feed",
  "no published versions",
];

export const UPDATER_USER_ERROR_MESSAGE =
  "Não foi possível verificar atualizações agora. Verifique sua conexão e tente novamente.";

export function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function shouldAllowPrerelease(version: string): boolean {
  return /-[a-z0-9]/i.test(version.trim());
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function isOfflineLikeError(message: string | null | undefined): boolean {
  const text = (message ?? "").toLowerCase();
  if (!text.trim()) return false;
  return OFFLINE_HINTS.some((hint) => text.includes(hint));
}

export function isUpdaterFeedUnavailableError(
  message: string | null | undefined
): boolean {
  const text = (message ?? "").toLowerCase();
  if (!text.trim()) return false;
  return FEED_UNAVAILABLE_HINTS.some((hint) => text.includes(hint));
}

/** User-facing updater error — never expose HTTP headers/cookies/raw GitHub payloads. */
export function sanitizeUpdaterUserError(
  message: string | null | undefined
): string {
  const text = (message ?? "").trim();
  if (!text) return UPDATER_USER_ERROR_MESSAGE;
  const lower = text.toLowerCase();

  if (
    isOfflineLikeError(text) ||
    isUpdaterFeedUnavailableError(text) ||
    lower.includes("method: get url:") ||
    lower.includes("set-cookie") ||
    lower.includes("_gh_sess") ||
    text.length > 160
  ) {
    return UPDATER_USER_ERROR_MESSAGE;
  }

  return text;
}

/** Prerelease channel id for electron-updater (e.g. rc in 1.0.0-rc.3). */
export function resolveUpdaterChannelName(version: string): string | null {
  const match = version.trim().match(/-([a-zA-Z][a-zA-Z0-9]*)/);
  return match ? match[1].toLowerCase() : null;
}

export function resolveUpdateChannel(
  version: string
): DesktopUpdateStatus["channel"] {
  return shouldAllowPrerelease(version) ? "prerelease" : "stable";
}

export function createIdleUpdateStatus(input: {
  currentVersion: string;
  packaged: boolean;
  feedUrl: string;
  provider?: DesktopUpdateStatus["provider"];
}): DesktopUpdateStatus {
  return {
    phase: "idle",
    currentVersion: input.currentVersion,
    availableVersion: null,
    progress: null,
    message: "",
    error: null,
    packaged: input.packaged,
    feedUrl: input.feedUrl,
    installOnQuit: false,
    lastCheckedAt: null,
    provider: input.provider ?? "github",
    channel: resolveUpdateChannel(input.currentVersion),
  };
}

export function mapProgress(input: {
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
}): DesktopUpdateProgress {
  return {
    percent: clampPercent(Number(input.percent) || 0),
    bytesPerSecond: Math.max(0, Number(input.bytesPerSecond) || 0),
    transferred: Math.max(0, Number(input.transferred) || 0),
    total: Math.max(0, Number(input.total) || 0),
  };
}

export function canInstallNow(input: {
  phase: DesktopUpdatePhase;
  criticalOperation: boolean;
  when: DesktopUpdateInstallWhen;
  criticalReason?: string | null;
}): { ok: true } | { ok: false; reason: string } {
  if (input.phase !== "downloaded") {
    return { ok: false, reason: "A atualização ainda não foi baixada." };
  }

  if (input.when === "now" && input.criticalOperation) {
    return {
      ok: false,
      reason:
        input.criticalReason?.trim() ||
        "Há uma operação em andamento. Finalize ou cancele antes de atualizar.",
    };
  }

  return { ok: true };
}

/** Do not restart a check/download while an update is already in flight. */
export function shouldDeferUpdateCheck(phase: DesktopUpdatePhase): boolean {
  return (
    phase === "downloading" ||
    phase === "downloaded" ||
    phase === "installing"
  );
}

/**
 * Manifest file electron-builder still emits for the version channel.
 * GitHub Releases host this as an asset; the client does not fetch a generic URL.
 * Prerelease `1.0.0-rc.1` → `rc.yml`. Stable `1.0.0` → `latest.yml`.
 */
export function updateManifestFileName(version: string): string {
  const pre = version.trim().match(/-([a-zA-Z][a-zA-Z0-9]*)/);
  if (pre) return `${pre[1].toLowerCase()}.yml`;
  return "latest.yml";
}

export function phaseMessage(
  phase: DesktopUpdatePhase,
  availableVersion?: string | null
): string {
  switch (phase) {
    case "checking":
      return "Verificando atualizações…";
    case "up-to-date":
      return "Você está usando a versão mais recente.";
    case "available":
      return availableVersion
        ? `Versão ${availableVersion} está disponível.`
        : "Nova atualização disponível.";
    case "downloading":
      return "Baixando atualização…";
    case "downloaded":
      return "Atualização pronta para instalar.";
    case "installing":
      return "Instalando atualização…";
    case "error":
      return "Não foi possível atualizar agora.";
    default:
      return "";
  }
}
