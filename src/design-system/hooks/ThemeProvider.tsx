import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getTheme,
  type CosmoTheme,
  type CosmoThemeMode,
} from "../tokens";

export interface ThemeContextValue {
  theme: CosmoTheme;
  mode: CosmoThemeMode;
  setMode: (mode: CosmoThemeMode) => void;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function DesignSystemThemeProvider({
  children,
  defaultMode = "dark",
}: {
  children: ReactNode;
  defaultMode?: CosmoThemeMode;
}) {
  const [mode, setMode] = useState<CosmoThemeMode>(defaultMode);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(mode),
      mode,
      setMode,
      toggleMode,
    }),
    [mode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div data-cosmo-ds="v2" data-theme={mode} className="min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
