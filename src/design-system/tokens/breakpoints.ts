export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  uw: 1920,
} as const;

export const breakpointValues = {
  sm: { columns: 4, gutter: 16, margin: 16 },
  md: { columns: 8, gutter: 20, margin: 24 },
  lg: { columns: 12, gutter: 24, margin: 32 },
  xl: { columns: 12, gutter: 24, margin: 40 },
  "2xl": { columns: 12, gutter: 32, margin: 48, maxWidth: 1440 },
  uw: { columns: 12, gutter: 32, margin: "auto", maxWidth: 1600 },
} as const;

export type CosmoBreakpoint = keyof typeof breakpoints;
