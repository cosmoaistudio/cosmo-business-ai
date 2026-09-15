export const elevations = {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.04)",
  md: "0 8px 24px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  lg: "0 16px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.06)",
  xl: "0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)",
  glowPrimary: "0 0 40px rgba(37, 99, 235, 0.35), 0 0 80px rgba(37, 99, 235, 0.15)",
  glowSecondary: "0 0 40px rgba(124, 58, 237, 0.3)",
} as const;

export type DesignElevation = keyof typeof elevations;
