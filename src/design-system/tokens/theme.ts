import { motion } from "./animations";
import { breakpoints, breakpointValues } from "./breakpoints";
import { lightPalette, palette } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export const glass = {
  sidebar: {
    background:
      "linear-gradient(180deg, rgba(10, 15, 26, 0.92) 0%, rgba(17, 24, 39, 0.88) 100%)",
    backdropFilter: "blur(24px) saturate(150%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  panel: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(16px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  card: {
    background: "rgba(17, 24, 39, 0.72)",
    backdropFilter: "blur(18px) saturate(130%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  header: {
    background: "rgba(3, 7, 18, 0.75)",
    backdropFilter: "blur(20px) saturate(140%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
} as const;

export const focusRing = {
  width: "2px",
  offset: "2px",
  color: palette.accent.blue,
} as const;

export type CosmoThemeMode = "dark" | "light";

export const darkTheme = {
  mode: "dark" as const,
  colors: palette,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  breakpoints,
  breakpointValues,
  glass,
  focusRing,
};

export const lightTheme = {
  mode: "light" as const,
  colors: lightPalette,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  breakpoints,
  breakpointValues,
  glass: {
    sidebar: {
      background: "rgba(255, 255, 255, 0.92)",
      backdropFilter: "blur(24px) saturate(150%)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
    },
    panel: {
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(16px) saturate(140%)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
    },
    card: {
      background: "rgba(255, 255, 255, 0.85)",
      backdropFilter: "blur(18px) saturate(130%)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
    },
    header: {
      background: "rgba(249, 250, 251, 0.85)",
      backdropFilter: "blur(20px) saturate(140%)",
      border: "1px solid rgba(15, 23, 42, 0.08)",
    },
  },
  focusRing: {
    width: "2px",
    offset: "2px",
    color: lightPalette.accent.blue,
  },
};

export type CosmoTheme = typeof darkTheme | typeof lightTheme;

export const themes = {
  dark: darkTheme,
  light: lightTheme,
} as const;

export function getTheme(mode: CosmoThemeMode): CosmoTheme {
  return themes[mode];
}
