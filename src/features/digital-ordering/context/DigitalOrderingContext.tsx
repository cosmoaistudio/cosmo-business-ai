import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import type { DigitalOrderContext } from "../types/digitalOrdering.types";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { useDigitalCart } from "../hooks/useDigitalCart";
import {
  listCheckoutFulfillmentOptions,
  resolveInitialCheckoutFulfillment,
  type CheckoutFulfillmentMode,
} from "../utils/checkoutFulfillment";

export interface DigitalOrderingContextValue {
  store: DigitalStoreSettings | null;
  context: DigitalOrderContext;
  cart: ReturnType<typeof useDigitalCart>;
  /** When true, /menu checkout may switch between pickup and delivery. */
  allowFulfillmentChoice: boolean;
  fulfillmentOptions: CheckoutFulfillmentMode[];
  setFulfillmentMode: ((mode: CheckoutFulfillmentMode) => void) | null;
}

const DigitalOrderingContext = createContext<DigitalOrderingContextValue | null>(
  null
);

export function DigitalOrderingProvider({
  store,
  mode: initialMode,
  tableId,
  tableLabel,
  allowFulfillmentChoice = false,
  children,
}: {
  store: DigitalStoreSettings | null;
  mode: DigitalOrderMode;
  tableId?: string;
  tableLabel?: string;
  /**
   * Generic /menu checkout only. Locked routes (/pickup, /delivery, /table)
   * must leave this false.
   */
  allowFulfillmentChoice?: boolean;
  children: ReactNode;
}) {
  const fulfillmentOptions = useMemo(
    () =>
      store && allowFulfillmentChoice
        ? listCheckoutFulfillmentOptions(store)
        : [],
    [store, allowFulfillmentChoice]
  );

  const [fulfillmentMode, setFulfillmentModeState] =
    useState<CheckoutFulfillmentMode | null>(null);

  useEffect(() => {
    if (!allowFulfillmentChoice || !store) {
      setFulfillmentModeState(null);
      return;
    }

    setFulfillmentModeState((current) => {
      const options = listCheckoutFulfillmentOptions(store);
      if (current && options.includes(current)) return current;
      return resolveInitialCheckoutFulfillment(store, initialMode);
    });
  }, [
    allowFulfillmentChoice,
    store,
    store?.acceptsDelivery,
    store?.acceptsPickup,
    initialMode,
  ]);

  const setFulfillmentMode = useCallback(
    (mode: CheckoutFulfillmentMode) => {
      if (!allowFulfillmentChoice) return;
      if (!fulfillmentOptions.includes(mode)) return;
      setFulfillmentModeState(mode);
    },
    [allowFulfillmentChoice, fulfillmentOptions]
  );

  const effectiveMode: DigitalOrderMode =
    allowFulfillmentChoice && fulfillmentMode
      ? fulfillmentMode
      : initialMode;

  const deliveryFee =
    effectiveMode === "delivery" && store ? store.deliveryFee : 0;

  const cart = useDigitalCart(deliveryFee);

  const context = useMemo<DigitalOrderContext>(
    () => ({
      mode: effectiveMode,
      tableId,
      tableLabel,
    }),
    [effectiveMode, tableId, tableLabel]
  );

  const value = useMemo<DigitalOrderingContextValue>(
    () => ({
      store,
      context,
      cart,
      allowFulfillmentChoice,
      fulfillmentOptions,
      setFulfillmentMode: allowFulfillmentChoice ? setFulfillmentMode : null,
    }),
    [
      store,
      context,
      cart,
      allowFulfillmentChoice,
      fulfillmentOptions,
      setFulfillmentMode,
    ]
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
    throw new Error(
      "useDigitalOrderingContext must be used within DigitalOrderingProvider"
    );
  }
  return ctx;
}
