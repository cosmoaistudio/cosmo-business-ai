import type { CSSProperties } from "react";
import type { DigitalStoreTheme } from "../../types/digitalStore.types";
import type {
  MenuRadius,
  MenuShadowStyle,
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
  surfaceElevated: "rgba(255, 255, 255, 0.1)",
  surfaceMuted: "rgba(255, 255, 255, 0.04)",
  textColor: "#f8fafc",
  mutedTextColor: "#94a3b8",
  borderColor: "rgba(255, 255, 255, 0.12)",
  successColor: "#22c55e",
  warningColor: "#f59e0b",
  errorColor: "#ef4444",
  fontFamily: "'Geist Variable', system-ui, sans-serif",
  headingFontFamily: "'Geist Variable', system-ui, sans-serif",
  baseFontSize: "md",
  headingFontWeight: "bold",
  bodyFontWeight: "normal",
  headingScale: "md",
  cardRadius: "lg",
  buttonRadius: "lg",
  buttonStyle: "solid",
  buttonHeight: "md",
  buttonFontWeight: "semibold",
  buttonShadow: false,
  productLayout: "grid",
  bannerStyle: "image",
  bannerHeight: "md",
  bannerOverlay: "soft",
  bannerRadius: "lg",
  density: "comfortable",
  contentWidth: "default",
  catalogColumns: 2,
  pricePosition: "below",
  ctaPosition: "footer",
  cardStyle: "elevated",
  showProductImages: true,
  imageAspect: "square",
  imageSize: "medium",
  logoSize: "md",
  headerAlign: "left",
  shadowStyle: "soft",
};

const RADIUS_SCALE: Record<MenuRadius, string> = {
  none: "0px",
  sm: "8px",
  md: "14px",
  lg: "20px",
  xl: "28px",
};

const SHADOW_SCALE: Record<MenuShadowStyle, string> = {
  none: "none",
  soft: "0 8px 24px rgba(0, 0, 0, 0.18)",
  medium: "0 12px 32px rgba(0, 0, 0, 0.28)",
};

export function radiusToCss(radius: MenuRadius): string {
  return RADIUS_SCALE[radius] ?? RADIUS_SCALE.lg;
}

export function shadowFor(theme: MenuTheme): string {
  return SHADOW_SCALE[theme.shadowStyle] ?? SHADOW_SCALE.soft;
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
  const cardRadius = radiusToCss(theme.cardRadius);
  const buttonRadius = radiusToCss(theme.buttonRadius);
  const basePx =
    theme.baseFontSize === "sm" ? "14px" : theme.baseFontSize === "lg" ? "17px" : "15px";

  return {
    "--menu-primary": theme.primaryColor,
    "--menu-secondary": theme.secondaryColor,
    "--menu-accent": theme.accentColor,
    "--menu-bg": theme.backgroundColor,
    "--menu-surface": theme.surfaceColor,
    "--menu-surface-elevated": theme.surfaceElevated,
    "--menu-surface-muted": theme.surfaceMuted,
    "--menu-text": theme.textColor,
    "--menu-text-muted": theme.mutedTextColor,
    "--menu-border": theme.borderColor,
    "--menu-success": theme.successColor,
    "--menu-warning": theme.warningColor,
    "--menu-error": theme.errorColor,
    "--menu-font": theme.fontFamily,
    "--menu-font-heading": theme.headingFontFamily,
    "--menu-font-size": basePx,
    "--menu-card-radius": cardRadius,
    "--menu-button-radius": buttonRadius,
    "--menu-shadow": shadowFor(theme),
    "--digital-primary": theme.primaryColor,
    "--digital-secondary": theme.secondaryColor,
    "--digital-accent": theme.accentColor,
    "--digital-bg": theme.backgroundColor,
    "--digital-surface": theme.surfaceColor,
    "--digital-surface-elevated": theme.surfaceElevated,
    "--digital-surface-muted": theme.surfaceMuted,
    "--digital-text": theme.textColor,
    "--digital-muted": theme.mutedTextColor,
    "--digital-border": theme.borderColor,
    "--digital-success": theme.successColor,
    "--digital-warning": theme.warningColor,
    "--digital-error": theme.errorColor,
    "--digital-font": theme.fontFamily,
    "--digital-font-heading": theme.headingFontFamily,
    "--digital-font-size": basePx,
    "--digital-radius-card": cardRadius,
    "--digital-radius-button": buttonRadius,
    "--digital-shadow": shadowFor(theme),
  };
}

/** Inline style object — scoped to the menu subtree, no global side effects. */
export function menuThemeStyle(theme: MenuTheme): CSSProperties {
  return menuThemeToCssVars(theme) as CSSProperties;
}

/** Page canvas — solid for minimal niches, soft theme-derived wash otherwise. */
export function canvasBackgroundFor(theme: MenuTheme): string {
  if (theme.bannerStyle === "minimal" || theme.bannerStyle === "hidden") {
    return theme.backgroundColor;
  }

  return `linear-gradient(165deg, ${theme.backgroundColor} 0%, color-mix(in srgb, ${theme.backgroundColor} 72%, ${theme.secondaryColor}) 100%)`;
}

/** Shared panel chrome for sheets/drawers so they inherit MenuTheme. */
export function sheetPanelStyle(theme: MenuTheme): CSSProperties {
  return {
    ...menuThemeStyle(theme),
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.fontFamily,
  };
}

export function surfaceStyle(theme: MenuTheme): CSSProperties {
  return {
    backgroundColor: theme.surfaceColor,
    borderColor: theme.borderColor,
    borderRadius: radiusToCss(theme.cardRadius),
    color: theme.textColor,
  };
}

export function elevatedSurfaceStyle(theme: MenuTheme): CSSProperties {
  return {
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.borderColor,
    borderRadius: radiusToCss(theme.cardRadius),
    color: theme.textColor,
    boxShadow: shadowFor(theme),
  };
}

export function inputStyle(
  theme: MenuTheme,
  options: { invalid?: boolean; disabled?: boolean } = {}
): CSSProperties {
  return {
    backgroundColor: theme.surfaceColor,
    borderColor: options.invalid ? theme.warningColor : theme.borderColor,
    borderRadius: radiusToCss(theme.buttonRadius),
    color: theme.textColor,
    fontFamily: theme.fontFamily,
    opacity: options.disabled ? 0.55 : 1,
  };
}

export function selectableSurfaceStyle(
  theme: MenuTheme,
  selected: boolean
): CSSProperties {
  if (selected) {
    return {
      borderColor: theme.primaryColor,
      backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`,
      color: theme.textColor,
      borderRadius: radiusToCss(theme.buttonRadius),
    };
  }

  return {
    borderColor: theme.borderColor,
    backgroundColor: theme.surfaceColor,
    color: theme.textColor,
    borderRadius: radiusToCss(theme.buttonRadius),
  };
}

export function focusRingStyle(theme: MenuTheme): CSSProperties {
  return {
    outlineColor: theme.primaryColor,
  };
}

export function buttonStyleFor(theme: MenuTheme): CSSProperties {
  const height =
    theme.buttonHeight === "sm"
      ? "2.25rem"
      : theme.buttonHeight === "lg"
        ? "3rem"
        : "2.75rem";
  const fontWeight =
    theme.buttonFontWeight === "bold"
      ? 700
      : theme.buttonFontWeight === "medium"
        ? 500
        : theme.buttonFontWeight === "normal"
          ? 400
          : 600;
  const shadow = theme.buttonShadow ? shadowFor(theme) : "none";

  const base: CSSProperties = {
    borderRadius: radiusToCss(theme.buttonRadius),
    minHeight: height,
    fontWeight,
    boxShadow: shadow,
    fontFamily: theme.fontFamily,
  };

  switch (theme.buttonStyle) {
    case "soft":
      return {
        ...base,
        backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 22%, transparent)`,
        color: theme.textColor,
      };
    case "outline":
      return {
        ...base,
        backgroundColor: "transparent",
        color: theme.textColor,
        border: `1px solid ${theme.primaryColor}`,
      };
    case "solid":
    default:
      return {
        ...base,
        backgroundColor: theme.primaryColor,
        color: "#ffffff",
      };
  }
}

/** Adaptive banner text/overlay from theme (strength via bannerOverlay). */
export function bannerOverlayStyle(theme: MenuTheme): CSSProperties {
  if (theme.bannerOverlay === "none") {
    return { background: "transparent", color: theme.textColor };
  }
  const ink = theme.backgroundColor;
  const strong = theme.bannerOverlay === "strong";
  return {
    background: strong
      ? `linear-gradient(to top, color-mix(in srgb, ${ink} 96%, transparent) 0%, color-mix(in srgb, ${ink} 70%, transparent) 60%, transparent 100%)`
      : `linear-gradient(to top, color-mix(in srgb, ${ink} 92%, transparent) 0%, color-mix(in srgb, ${ink} 55%, transparent) 55%, transparent 100%)`,
    color: theme.textColor,
  };
}

export function fontWeightCss(weight: MenuTheme["headingFontWeight"]): number {
  switch (weight) {
    case "normal":
      return 400;
    case "medium":
      return 500;
    case "semibold":
      return 600;
    case "bold":
    default:
      return 700;
  }
}

export function headingSizeClass(theme: MenuTheme): string {
  switch (theme.headingScale) {
    case "sm":
      return "text-xl sm:text-2xl";
    case "lg":
      return "text-3xl sm:text-4xl";
    case "md":
    default:
      return "text-2xl sm:text-3xl";
  }
}

export function contentWidthClass(theme: MenuTheme): string {
  switch (theme.contentWidth) {
    case "narrow":
      return "max-w-lg sm:max-w-xl";
    case "wide":
      return "max-w-3xl md:max-w-5xl lg:max-w-7xl";
    case "default":
    default:
      return "max-w-lg sm:max-w-xl md:max-w-3xl lg:max-w-6xl xl:max-w-7xl";
  }
}

export function catalogColumnsClass(theme: MenuTheme): string {
  if (theme.productLayout === "list") return "grid-cols-1";
  switch (theme.catalogColumns) {
    case 3:
      return "grid-cols-2 xl:grid-cols-3";
    case 4:
      return "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    case 2:
    default:
      return "grid-cols-2";
  }
}

export function logoSizeClass(theme: MenuTheme): string {
  switch (theme.logoSize) {
    case "sm":
      return "h-11 w-11 sm:h-12 sm:w-12";
    case "lg":
      return "h-16 w-16 sm:h-20 sm:w-20";
    case "md":
    default:
      return "h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]";
  }
}

export function bannerHeightClass(theme: MenuTheme): string {
  switch (theme.bannerHeight) {
    case "sm":
      return "h-16 sm:h-20";
    case "lg":
      return "h-48 sm:h-56";
    case "md":
    default:
      return "h-36 sm:h-40";
  }
}

export {
  contrastHint,
  contrastRatio,
  contrastWarning,
  evaluateMenuContrast,
} from "./contrastHint";

/** Reads theme overrides persisted in the existing jsonb. */
export function parseMenuThemeOverrides(
  raw: Record<string, unknown> | null | undefined
): MenuThemeOverrides {
  if (!raw || typeof raw !== "object") return {};

  const overrides: MenuThemeOverrides = {};
  const stringKeys: Array<keyof MenuTheme> = [
    "surfaceColor",
    "surfaceElevated",
    "surfaceMuted",
    "textColor",
    "mutedTextColor",
    "borderColor",
    "successColor",
    "warningColor",
    "errorColor",
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
    ["buttonHeight", ["sm", "md", "lg"]],
    ["buttonFontWeight", ["normal", "medium", "semibold", "bold"]],
    ["productLayout", ["grid", "list"]],
    ["bannerStyle", ["image", "gradient", "minimal", "hidden"]],
    ["bannerHeight", ["sm", "md", "lg"]],
    ["bannerOverlay", ["none", "soft", "strong"]],
    ["bannerRadius", ["none", "sm", "md", "lg", "xl"]],
    ["density", ["comfortable", "compact", "spacious"]],
    ["shadowStyle", ["none", "soft", "medium"]],
    ["baseFontSize", ["sm", "md", "lg"]],
    ["headingFontWeight", ["normal", "medium", "semibold", "bold"]],
    ["bodyFontWeight", ["normal", "medium", "semibold", "bold"]],
    ["headingScale", ["sm", "md", "lg"]],
    ["contentWidth", ["narrow", "default", "wide"]],
    ["pricePosition", ["below", "inline", "trailing", "top", "bottom"]],
    ["ctaPosition", ["footer", "inline", "bottom", "full"]],
    ["cardStyle", ["elevated", "flat", "bordered"]],
    ["imageSize", ["compact", "medium", "large"]],
    ["logoSize", ["sm", "md", "lg"]],
    ["headerAlign", ["left", "center"]],
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

  if (typeof raw.buttonShadow === "boolean") {
    overrides.buttonShadow = raw.buttonShadow;
  }

  if (
    typeof raw.imageAspect === "string" &&
    ["square", "portrait", "landscape"].includes(raw.imageAspect)
  ) {
    overrides.imageAspect = raw.imageAspect as MenuTheme["imageAspect"];
  }

  if (
    typeof raw.catalogColumns === "number" &&
    [2, 3, 4].includes(raw.catalogColumns)
  ) {
    overrides.catalogColumns = raw.catalogColumns as MenuTheme["catalogColumns"];
  }

  return overrides;
}
