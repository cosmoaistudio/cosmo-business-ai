import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CosmoAiDrawerContextValue {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CosmoAiDrawerContext = createContext<CosmoAiDrawerContextValue | null>(
  null
);

export function CosmoAiDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggleDrawer = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, openDrawer, closeDrawer, toggleDrawer }),
    [open, openDrawer, closeDrawer, toggleDrawer]
  );

  return (
    <CosmoAiDrawerContext.Provider value={value}>
      {children}
    </CosmoAiDrawerContext.Provider>
  );
}

export function useCosmoAiDrawer() {
  const ctx = useContext(CosmoAiDrawerContext);
  if (!ctx) {
    throw new Error("useCosmoAiDrawer must be used within CosmoAiDrawerProvider");
  }
  return ctx;
}
