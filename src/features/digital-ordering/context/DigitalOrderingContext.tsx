import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import type { DigitalOrderContext } from "../types/digitalOrdering.types";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { useDigitalCart } from "../hooks/useDigitalCart";

export interface DigitalOrderingContextValue {
  store: DigitalStoreSettings | null;
  context: DigitalOrderContext;
  cart: ReturnType<typeof useDigitalCart>;
}

const DigitalOrderingContext = createContext<DigitalOrderingContextValue | null>(
  null
);

export function DigitalOrderingProvider({
  store,
  mode,
  tableId,
  tableLabel,
  children,
}: {
  store: DigitalStoreSettings | null;
  mode: DigitalOrderMode;
  tableId?: string;
  tableLabel?: string;
  children: ReactNode;
}) {
  const deliveryFee =
    mode === "delivery" && store ? store.deliveryFee : 0;

  const cart = useDigitalCart(deliveryFee);

  const context = useMemo<DigitalOrderContext>(
    () => ({
      mode,
      tableId,
      tableLabel,
    }),
    [mode, tableId, tableLabel]
  );

  const value = useMemo(
    () => ({ store, context, cart }),
    [store, context, cart]
  );

  return (
    <DigitalOrderingContext.Provider value={value}>
      {children}
    </DigitalOrderingContext.Provider>
  );
}

export function useDigitalOrderingContext() {
  const ctx = useContext(DigitalOrderingContext);
  if (!ctx) {
    throw new Error("useDigitalOrderingContext must be used within DigitalOrderingProvider");
  }
  return ctx;
}
