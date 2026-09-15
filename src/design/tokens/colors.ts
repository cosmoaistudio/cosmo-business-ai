export const colors = {
  background: "#050816",
  backgroundElevated: "#0B1020",
  backgroundMuted: "#111827",
  surface: "#0F172A",
  surfaceHover: "#1E293B",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryGlow: "rgba(37, 99, 235, 0.45)",
  secondary: "#7C3AED",
  secondaryHover: "#6D28D9",
  secondaryGlow: "rgba(124, 58, 237, 0.35)",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textSubtle: "#64748B",
  white: "#FFFFFF",
} as const;

export type DesignColor = keyof typeof colors;
