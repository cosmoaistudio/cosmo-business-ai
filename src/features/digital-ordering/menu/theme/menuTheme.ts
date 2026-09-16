import type { CSSProperties } from "react";
import type { DigitalStoreTheme } from "../../types/digitalStore.types";
import type {
  MenuRadius,
  MenuTheme,
  MenuThemeOverrides,
  NicheConfig,
} from "../types/digitalMenu.types";

export const DEFAULT_MENU_THEME: MenuTheme = {
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  accentColor: "#38bdf8",
  backgroundColor: "#0f172a",
  surfaceColor: "rgba(255, 255, 255, 0.06)",
  textColor: "#f8fafc",
  mutedTextColor: "#94a3b8",
  borderColor: "rgba(255, 255, 255, 0.12)",
  fontFamily: "'Geist Variable', system-ui, sans-serif",
  headingFontFamily: "'Geist Variable', system-ui, sans-serif",
  cardRadius: "lg",
  buttonRadius: "lg",
  buttonStyle: "solid",
  productLayout: "grid",
  bannerStyle: "image",
  density: "comfortable",
  showProductImages: true,
};

const RADIUS_SCALE: Record<MenuRadius, string> = {
  none: "0px",
  sm: "8px",
  md: "14px",
  lg: "20px",
  xl: "28px",
};

export function radiusToCss(radius: MenuRadius): string {
  return RADIUS_SCALE[radius] ?? RADIUS_SCALE.lg;
}

/** Tailwind-friendly class for the resolved radius. */
export function radiusToClass(radius: MenuRadius): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-lg";
    case "md":
      return "rounded-xl";
    case "xl":
      return "rounded-[28px]";
    case "lg":
    default:
      return "rounded-2xl";
  }
}

/**
 * Precedence: explicit store overrides > niche defaults > engine defaults.
 * The legacy 4-color `DigitalStoreTheme` keeps working untouched.
 */
export function resolveMenuTheme(
  storeTheme: DigitalStoreTheme | null | undefined,
  config: NicheConfig,
  overrides: MenuThemeOverrides = {}
): MenuTheme {
  const fromStore: MenuThemeOverrides = storeTheme
    ? {
        primaryColor: storeTheme.primaryColor,
        secondaryColor: storeTheme.secondaryColor,
        accentColor: storeTheme.accentColor,
        backgroundColor: storeTheme.backgroundColor,
      }
    : {};

  return {
    ...DEFAULT_MENU_THEME,
    ...config.theme,
    ...fromStore,
    ...overrides,
  };
}

export function menuThemeToCssVars(theme: MenuTheme): Record<string, string> {
  return {
    "--menu-primary": theme.primaryColor,
    "--menu-secondary": theme.secondaryColor,
    "--menu-accent": theme.accentColor,
    "--menu-bg": theme.backgroundColor,
    "--menu-surface": theme.surfaceColor,
    "--menu-text": theme.textColor,
    "--menu-text-muted": theme.mutedTextColor,
    "--menu-border": theme.borderColor,
    "--menu-font": theme.fontFamily,
    "--menu-font-heading": theme.headingFontFamily,
    "--menu-card-radius": radiusToCss(theme.cardRadius),
    "--menu-button-radius": radiusToCss(theme.buttonRadius),
  };
}

/** Inline style object — scoped to the menu subtree, no global side effects. */
export function menuThemeStyle(theme: MenuTheme): CSSProperties {
  return menuThemeToCssVars(theme) as CSSProperties;
}

export function buttonStyleFor(theme: MenuTheme): CSSProperties {
  switch (theme.buttonStyle) {
    case "soft":
      return {
        backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`,
        color: theme.textColor,
        borderRadius: radiusToCss(theme.buttonRadius),
      };
    case "outline":
      return {
        backgroundColor: "transparent",
        color: theme.textColor,
        border: `1px solid ${theme.primaryColor}`,
        borderRadius: radiusToCss(theme.buttonRadius),
      };
    case "solid":
    default:
      return {
        backgroundColor: theme.primaryColor,
        color: "#ffffff",
        borderRadius: radiusToCss(theme.buttonRadius),
      };
  }
}

/** Reads theme overrides persisted in the existing `digital_stores.theme` jsonb. */
export function parseMenuThemeOverrides(
  raw: Record<string, unknown> | null | undefined
): MenuThemeOverrides {
  if (!raw || typeof raw !== "object") return {};

  const overrides: MenuThemeOverrides = {};
  const stringKeys: Array<keyof MenuTheme> = [
    "surfaceColor",
    "textColor",
    "mutedTextColor",
    "borderColor",
    "fontFamily",
    "headingFontFamily",
  ];

  for (const key of stringKeys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length > 0) {
      overrides[key] = value as never;
    }
  }

  const enums: Array<[keyof MenuTheme, readonly string[]]> = [
    ["cardRadius", ["none", "sm", "md", "lg", "xl"]],
    ["buttonRadius", ["none", "sm", "md", "lg", "xl"]],
    ["buttonStyle", ["solid", "soft", "outline"]],
    ["productLayout", ["grid", "list"]],
    ["bannerStyle", ["image", "gradient", "minimal"]],
    ["density", ["comfortable", "compact"]],
  ];

  for (const [key, allowed] of enums) {
    const value = raw[key];
    if (typeof value === "string" && allowed.includes(value)) {
      overrides[key] = value as never;
    }
  }

  if (typeof raw.showProductImages === "boolean") {
    overrides.showProductImages = raw.showProductImages;
  }

  return overrides;
}
