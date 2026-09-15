import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface OverlayPresenceContextValue {
  /** Number of open modal/sheet layers that should suppress floating assists. */
  overlayDepth: number;
  beginOverlay: () => void;
  endOverlay: () => void;
  isOverlayActive: boolean;
}

const OverlayPresenceContext =
  createContext<OverlayPresenceContextValue | null>(null);

export function OverlayPresenceProvider({ children }: { children: ReactNode }) {
  const [overlayDepth, setOverlayDepth] = useState(0);

  const beginOverlay = useCallback(() => {
    setOverlayDepth((depth) => depth + 1);
  }, []);

  const endOverlay = useCallback(() => {
    setOverlayDepth((depth) => Math.max(0, depth - 1));
  }, []);

  const value = useMemo(
    () => ({
      overlayDepth,
      beginOverlay,
      endOverlay,
      isOverlayActive: overlayDepth > 0,
    }),
    [overlayDepth, beginOverlay, endOverlay]
  );

  return (
    <OverlayPresenceContext.Provider value={value}>
      {children}
    </OverlayPresenceContext.Provider>
  );
}

export function useOverlayPresence() {
  const ctx = useContext(OverlayPresenceContext);
  if (!ctx) {
    throw new Error(
      "useOverlayPresence must be used within OverlayPresenceProvider"
    );
  }
  return ctx;
}

/** Optional: safe no-op when provider is absent (tests / isolated trees). */
export function useOptionalOverlayPresence() {
  return useContext(OverlayPresenceContext);
}
