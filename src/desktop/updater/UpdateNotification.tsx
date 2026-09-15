import { Download, RefreshCw, Rocket } from "lucide-react";
import { useDesktopUpdater } from "./useDesktopUpdater";
import { formatDownloadSpeed, isVisibleUpdatePhase } from "./types";
import "./update-notification.css";

export function UpdateNotification() {
  const { isDesktop, status, busy, localError, download, install, dismiss } =
    useDesktopUpdater();

  if (!isDesktop) return null;
  if (!isVisibleUpdatePhase(status.phase) && !status.installOnQuit) return null;

  const error = localError ?? (status.phase === "error" ? status.error : null);
  const percent = status.progress?.percent ?? 0;
  const speed = formatDownloadSpeed(status.progress?.bytesPerSecond ?? 0);

  return (
    <aside
      className="cosmo-update-toast"
      role="status"
      aria-live="polite"
      data-phase={status.phase}
    >
      {status.phase === "available" ? (
        <>
          <p className="cosmo-update-toast__title">Nova atualização disponível</p>
          <p className="cosmo-update-toast__desc">
            {status.message ||
              (status.availableVersion
                ? `Versão ${status.availableVersion} está disponível.`
                : "Uma nova versão do Cosmo Business está pronta para baixar.")}
          </p>
          <div className="cosmo-update-toast__actions">
            <button
              type="button"
              className="cosmo-update-toast__btn cosmo-update-toast__btn--primary"
              disabled={busy}
              onClick={() => void download()}
            >
              <Download size={14} />
              Baixar atualização
            </button>
            <button
              type="button"
              className="cosmo-update-toast__btn"
              disabled={busy}
              onClick={() => void dismiss()}
            >
              Agora não
            </button>
          </div>
        </>
      ) : null}

      {status.phase === "downloading" ? (
        <>
          <p className="cosmo-update-toast__title">Baixando atualização…</p>
          <p className="cosmo-update-toast__desc">
            {percent}%{speed ? ` · ${speed}` : ""}
          </p>
          <div
            className="cosmo-update-toast__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </>
      ) : null}

      {status.phase === "downloaded" || status.installOnQuit ? (
        <>
          <p className="cosmo-update-toast__title">
            <Rocket size={16} /> Atualização pronta 🚀
          </p>
          <p className="cosmo-update-toast__desc">
            {status.installOnQuit
              ? "A atualização será instalada ao fechar o Cosmo Business."
              : "Reinicie o Cosmo Business para concluir."}
          </p>
          {error ? <p className="cosmo-update-toast__error">{error}</p> : null}
          {!status.installOnQuit ? (
            <div className="cosmo-update-toast__actions">
              <button
                type="button"
                className="cosmo-update-toast__btn cosmo-update-toast__btn--primary"
                disabled={busy}
                onClick={() => void install("now")}
              >
                Atualizar agora
              </button>
              <button
                type="button"
                className="cosmo-update-toast__btn"
                disabled={busy}
                onClick={() => void install("quit")}
              >
                Atualizar ao fechar
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {status.phase === "error" ? (
        <>
          <p className="cosmo-update-toast__title">Atualização</p>
          <p className="cosmo-update-toast__error">
            {error || "Não foi possível atualizar agora."}
          </p>
          <button
            type="button"
            className="cosmo-update-toast__btn"
            disabled={busy}
            onClick={() => void dismiss()}
          >
            <RefreshCw size={14} />
            Fechar
          </button>
        </>
      ) : null}
    </aside>
  );
}
