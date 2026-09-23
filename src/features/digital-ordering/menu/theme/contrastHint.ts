export type ContrastHintLevel = "ok" | "low" | "unknown";

function parseHex(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(color: { r: number; g: number; b: number }) {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

/** WCAG-ish contrast ratio. Returns null when a color is not a 6-digit hex. */
export function contrastRatio(foreground: string, background: string): number | null {
  const a = parseHex(foreground);
  const b = parseHex(background);
  if (!a || !b) return null;
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

/** Rough WCAG-ish contrast hint for editor color fields (not a full a11y engine). */
export function contrastHint(
  foreground: string,
  background: string
): ContrastHintLevel {
  const ratio = contrastRatio(foreground, background);
  if (ratio == null) return "unknown";
  return ratio >= 4.5 ? "ok" : "low";
}

export function contrastWarning(
  foreground: string,
  background: string
): string | null {
  return contrastHint(foreground, background) === "low"
    ? "Esta combinação pode ter baixo contraste."
    : null;
}

export interface MenuContrastPair {
  id: string;
  label: string;
  level: ContrastHintLevel;
}

export interface MenuContrastReport {
  pairs: MenuContrastPair[];
  hasLowContrast: boolean;
}

/**
 * Advisory contrast report. Never auto-corrects user colors.
 */
export function evaluateMenuContrast(theme: {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
}): MenuContrastReport {
  const pairs: MenuContrastPair[] = [
    {
      id: "primary-bg",
      label: "Principal sobre fundo",
      level: contrastHint(theme.primaryColor, theme.backgroundColor),
    },
    {
      id: "text-card",
      label: "Texto sobre card",
      level: contrastHint(theme.textColor, theme.surfaceColor),
    },
    {
      id: "text-banner",
      label: "Texto sobre banner",
      level: contrastHint(theme.textColor, theme.primaryColor),
    },
    {
      id: "cta-solid",
      label: "CTA sólido",
      level: contrastHint("#ffffff", theme.primaryColor),
    },
    {
      id: "cta-soft",
      label: "CTA suave",
      level: contrastHint(theme.primaryColor, theme.surfaceColor),
    },
    {
      id: "badge",
      label: "Badge",
      level: contrastHint("#ffffff", theme.accentColor),
    },
    {
      id: "price",
      label: "Preço",
      level: contrastHint(theme.primaryColor, theme.surfaceColor),
    },
    {
      id: "muted",
      label: "Texto secundário",
      level: contrastHint(theme.mutedTextColor, theme.surfaceColor),
    },
  ];

  return {
    pairs,
    hasLowContrast: pairs.some((pair) => pair.level === "low"),
  };
}
