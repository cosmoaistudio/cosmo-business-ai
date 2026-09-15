import { useContext } from "react";

import { darkTheme } from "../tokens";

import { ThemeContext, type ThemeContextValue } from "./ThemeProvider";

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: darkTheme,
      mode: "dark",
      setMode: () => undefined,
      toggleMode: () => undefined,
    };
  }
  return context;
}
