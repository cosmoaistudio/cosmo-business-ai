import { createContext, useContext, type ReactNode } from "react";

import { useCosmoAi } from "../hooks/useCosmoAi";

type CosmoAiContextValue = ReturnType<typeof useCosmoAi>;

const CosmoAiContext = createContext<CosmoAiContextValue | null>(null);

export function CosmoAiProvider({ children }: { children: ReactNode }) {
  const value = useCosmoAi();
  return (
    <CosmoAiContext.Provider value={value}>{children}</CosmoAiContext.Provider>
  );
}

export function useCosmoAiContext() {
  const ctx = useContext(CosmoAiContext);
  if (!ctx) {
    throw new Error("useCosmoAiContext must be used within CosmoAiProvider");
  }
  return ctx;
}
