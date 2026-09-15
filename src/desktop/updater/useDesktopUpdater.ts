import { useCallback, useEffect, useState } from "react";
import { getDesktopApi, isDesktopApp } from "../types";
import {
  getCriticalOperationReason,
  isCriticalOperationActive,
} from "../criticalOperation";
import type {
  DesktopUpdateInstallWhen,
  DesktopUpdateStatus,
} from "./types";
import { resolveRendererUpdateChannel } from "./types";

const EMPTY: DesktopUpdateStatus = {
  phase: "idle",
  currentVersion: "",
  availableVersion: null,
  progress: null,
  message: "",
  error: null,
  packaged: false,
  feedUrl: "",
  installOnQuit: false,
  lastCheckedAt: null,
  provider: "github",
  channel: "stable",
};

function normalizeStatus(next: DesktopUpdateStatus): DesktopUpdateStatus {
  return {
    ...EMPTY,
    ...next,
    provider: next.provider ?? "github",
    channel:
      next.channel ?? resolveRendererUpdateChannel(next.currentVersion || ""),
  };
}

export function useDesktopUpdater() {
  const isDesktop = isDesktopApp();
  const api = getDesktopApi();
  const [status, setStatus] = useState<DesktopUpdateStatus>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!api?.updaterGetStatus) return;
    const next = (await api.updaterGetStatus()) as DesktopUpdateStatus;
    if (next?.phase) setStatus(normalizeStatus(next));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    void refresh();
    const unsubscribe = api.onEvent((payload) => {
      if (payload.type !== "desktop-update") return;
      const next = payload.data as DesktopUpdateStatus | undefined;
      if (next?.phase) setStatus(normalizeStatus(next));
    });
    return unsubscribe;
  }, [api, refresh]);

  useEffect(() => {
    if (!api?.checkUpdate) return;
    const onOnline = () => {
      const phase = status.phase;
      if (
        phase === "downloading" ||
        phase === "downloaded" ||
        phase === "installing"
      ) {
        return;
      }
      void api.checkUpdate();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [api, status.phase]);

  const check = useCallback(async () => {
    if (!api) return { ok: false, error: "Desktop API indisponível" };
    setBusy(true);
    setLocalError(null);
    try {
      const result = await api.checkUpdate();
      await refresh();
      return result;
    } finally {
      setBusy(false);
    }
  }, [api, refresh]);

  const download = useCallback(async () => {
    if (!api?.updaterDownload) {
      return { ok: false, error: "Atualização indisponível nesta versão." };
    }
    setBusy(true);
    setLocalError(null);
    try {
      const result = await api.updaterDownload();
      if (!result.ok) setLocalError(result.error ?? "Falha ao baixar.");
      await refresh();
      return result;
    } finally {
      setBusy(false);
    }
  }, [api, refresh]);

  const install = useCallback(
    async (when: DesktopUpdateInstallWhen) => {
      if (!api?.updaterInstall) {
        return { ok: false, error: "Atualização indisponível nesta versão." };
      }
      const criticalOperation = isCriticalOperationActive();
      const criticalReason = getCriticalOperationReason();
      if (when === "now" && criticalOperation) {
        const message =
          criticalReason ??
          "Há uma operação em andamento. Finalize ou cancele antes de atualizar.";
        setLocalError(message);
        return { ok: false, error: message };
      }
      setBusy(true);
      setLocalError(null);
      try {
        const result = await api.updaterInstall({
          when,
          criticalOperation,
          criticalReason: criticalReason ?? undefined,
        });
        if (!result.ok) setLocalError(result.error ?? "Não foi possível instalar.");
        await refresh();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [api, refresh]
  );

  const dismiss = useCallback(async () => {
    if (!api?.updaterDismiss) return;
    await api.updaterDismiss();
    await refresh();
  }, [api, refresh]);

  return {
    isDesktop,
    status,
    busy,
    localError,
    check,
    download,
    install,
    dismiss,
  };
}
