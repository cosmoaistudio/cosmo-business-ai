import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth";
import { operationOnboardingService } from "../services/operationOnboarding.service";
import type { OperationSetupStatus } from "../types";
import { getOperationSetupStatus } from "../utils/getOperationSetupStatus";

const EMPTY_STATUS = getOperationSetupStatus({
  hasFirstProductReady: false,
  hasActiveProductWithoutCategory: false,
  hasAddonGroup: false,
  hasMenuReady: false,
  hasDigitalOrderConfigured: false,
  hasFirstSale: false,
});

export interface OperationSetupContextValue {
  status: OperationSetupStatus;
  loading: boolean;
  reload: (opts?: { silent?: boolean }) => Promise<void>;
}

const OperationSetupContext = createContext<OperationSetupContextValue | null>(
  null
);

/**
 * Single shared source for operation getting-started status across Dashboard
 * and destination screens (avoids N parallel fetches of the same signals).
 */
export function OperationSetupProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const [status, setStatus] = useState<OperationSetupStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!organizationId) {
        setStatus(EMPTY_STATUS);
        setLoading(false);
        return;
      }

      const silent = Boolean(opts?.silent);
      if (!silent) setLoading(true);

      try {
        const next =
          await operationOnboardingService.loadStatus(organizationId);
        setStatus(next);
      } catch {
        setStatus(EMPTY_STATUS);
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({ status, loading, reload }),
    [status, loading, reload]
  );

  return (
    <OperationSetupContext.Provider value={value}>
      {children}
    </OperationSetupContext.Provider>
  );
}

export function useOperationSetup(): OperationSetupContextValue {
  const context = useContext(OperationSetupContext);
  if (!context) {
    throw new Error(
      "useOperationSetup deve ser usado dentro de OperationSetupProvider"
    );
  }
  return context;
}
