import { useCallback, useEffect, useState } from "react";
import {
  DESKTOP_COMMANDS,
  getDesktopApi,
  isDesktopApp,
  type DesktopCommandType,
  type DesktopStatus,
  type PrintJobPayload,
} from "./types";

export function useDesktopBridge() {
  const api = getDesktopApi();
  const isDesktop = isDesktopApp();
  const [status, setStatus] = useState<DesktopStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!api) return null;
    const next = await api.getStatus();
    setStatus(next);
    return next;
  }, [api]);

  useEffect(() => {
    if (!api) return;

    void refreshStatus();
    const unsubscribe = api.onEvent(() => {
      void refreshStatus();
    });

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 30000);

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [api, refreshStatus]);

  const invoke = useCallback(
    async (command: DesktopCommandType, payload?: Record<string, unknown>) => {
      if (!api) {
        return { ok: false, error: "Desktop API indisponível" };
      }

      return api.invoke({ command, payload });
    },
    [api]
  );

  const printReceipt = useCallback(
    (job: PrintJobPayload) => {
      if (!api) return Promise.resolve({ ok: false, error: "Desktop API indisponível" });
      return api.enqueuePrint({ ...job, type: "receipt" });
    },
    [api]
  );

  const printOrder = useCallback(
    (job: PrintJobPayload) => {
      if (!api) return Promise.resolve({ ok: false, error: "Desktop API indisponível" });
      return api.enqueuePrint({ ...job, type: "order" });
    },
    [api]
  );

  return {
    isDesktop,
    status,
    refreshStatus,
    invoke,
    printReceipt,
    printOrder,
    openDrawer: () => invoke(DESKTOP_COMMANDS.OPEN_DRAWER),
    syncDatabase: () => invoke(DESKTOP_COMMANDS.SYNC_DATABASE),
    updateSystem: () => invoke(DESKTOP_COMMANDS.UPDATE_SYSTEM),
    runBackup: () => invoke(DESKTOP_COMMANDS.RUN_BACKUP),
    offlineEnqueue: (operation: Record<string, unknown>) =>
      api?.offlineEnqueue(operation) ??
      Promise.resolve({ ok: false, error: "Desktop API indisponível" }),
  };
}
