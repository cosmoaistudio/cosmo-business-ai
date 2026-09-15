export const fontFamily = {
  sans: "'Geist Variable', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;

export const fontSize = {
  displayXl: "3rem", // 48px
  display: "2.25rem", // 36px
  headingLg: "1.5rem", // 24px
  heading: "1.25rem", // 20px
  body: "0.9375rem", // 15px
  caption: "0.75rem", // 12px
  overline: "0.6875rem", // 11px
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.15,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const letterSpacing = {
  overline: "0.08em",
  tight: "-0.02em",
  normal: "0",
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const;
