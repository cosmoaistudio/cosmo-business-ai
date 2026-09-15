import { RefreshCw } from "lucide-react";
import { useDesktopUpdater } from "./useDesktopUpdater";
import "./update-notification.css";
import {
  formatDownloadSpeed,
  formatLastCheckedAt,
  resolveRendererUpdateChannel,
  sanitizeRendererUpdaterError,
  updateChannelLabel,
  updateDiagnosticStatus,
  updatePhaseLabel,
  updateServerLabel,
} from "./types";

export function DesktopUpdatesPanel() {
  const { isDesktop, status, busy, localError, check, download, install } =
    useDesktopUpdater();

  const error =
    localError ??
    sanitizeRendererUpdaterError(
      status.phase === "error" ? status.error : null
    );
  const percent = status.progress?.percent ?? 0;
  const speed = formatDownloadSpeed(status.progress?.bytesPerSecond ?? 0);
  const channel = status.channel || resolveRendererUpdateChannel(status.currentVersion);
  const version = status.currentVersion || "—";

  return (
    <div className="space-y-3" data-testid="desktop-updates-panel">
      <h3 className="text-sm font-semibold text-slate-100">Atualizações</h3>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="cosmo-saas__muted">Versão instalada</dt>
          <dd className="text-slate-100">{version}</dd>
        </div>
        <div>
          <dt className="cosmo-saas__muted">Canal</dt>
          <dd className="text-slate-100">{updateChannelLabel(channel)}</dd>
        </div>
        <div>
          <dt className="cosmo-saas__muted">Servidor</dt>
          <dd className="text-slate-100">
            {updateServerLabel(status.provider || "github")}
          </dd>
        </div>
        <div>
          <dt className="cosmo-saas__muted">Status</dt>
          <dd className="text-slate-100">
            {isDesktop
              ? updateDiagnosticStatus(status.phase)
              : "Disponível no aplicativo Desktop"}
          </dd>
        </div>
        <div>
          <dt className="cosmo-saas__muted">Última verificação</dt>
          <dd className="text-slate-100">
            {formatLastCheckedAt(status.lastCheckedAt)}
          </dd>
        </div>
      </dl>

      {!isDesktop ? (
        <p className="cosmo-saas__desc">
          Abra o Cosmo Business instalado para verificar e instalar atualizações.
        </p>
      ) : null}

      {isDesktop && status.phase === "up-to-date" ? (
        <p className="text-sm text-slate-100">
          Você está usando a versão mais recente.
        </p>
      ) : null}

      {isDesktop && status.availableVersion ? (
        <p className="text-sm text-slate-100">
          Nova versão disponível: <strong>{status.availableVersion}</strong>
        </p>
      ) : null}

      {isDesktop && status.phase === "downloading" ? (
        <div>
          <p className="text-sm text-sky-200">
            Baixando atualização… {percent}%{speed ? ` · ${speed}` : ""}
          </p>
          <div
            className="cosmo-update-toast__bar mt-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : null}

      {isDesktop && (status.phase === "downloaded" || status.installOnQuit) ? (
        <p className="text-sm text-sky-200">
          {status.installOnQuit
            ? "A atualização será instalada ao fechar o Cosmo Business."
            : "Atualização pronta. Reinicie o Cosmo Business para concluir."}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {isDesktop && status.message && status.phase !== "up-to-date" ? (
        <p className="cosmo-saas__desc">{status.message || updatePhaseLabel(status.phase)}</p>
      ) : null}

      {isDesktop ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cosmo-saas__btn"
            disabled={busy}
            onClick={() => void check()}
          >
            <RefreshCw size={14} />
            {status.phase === "error" ? "Tentar novamente" : "Verificar agora"}
          </button>
          {status.phase === "available" ? (
            <button
              type="button"
              className="cosmo-saas__btn"
              disabled={busy}
              onClick={() => void download()}
            >
              Baixar atualização
            </button>
          ) : null}
          {status.phase === "downloaded" && !status.installOnQuit ? (
            <>
              <button
                type="button"
                className="cosmo-saas__btn"
                disabled={busy}
                onClick={() => void install("now")}
              >
                Atualizar agora
              </button>
              <button
                type="button"
                className="cosmo-saas__btn cosmo-saas__btn--ghost"
                disabled={busy}
                onClick={() => void install("quit")}
              >
                Atualizar ao fechar
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
