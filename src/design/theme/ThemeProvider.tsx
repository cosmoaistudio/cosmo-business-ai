import { createContext, useContext, useEffect, type ReactNode } from "react";
import { designTokens } from "../tokens/designTokens";
import { themeEngine, type CosmoTheme } from "./ThemeEngine";

interface ThemeContextValue {
  theme: CosmoTheme;
  tokens: typeof designTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    themeEngine.applyToDocument();
  }, []);

  const value: ThemeContextValue = {
    theme: themeEngine.getTheme(),
    tokens: designTokens,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}

export function useDesignTokens() {
  return useTheme().tokens;
}
