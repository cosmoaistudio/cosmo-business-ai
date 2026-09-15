/** Cosmo Official Design Reference — tokens extraídos da spec visual */
export const officialPalette = {
  void: "#020617",
  voidMid: "#0a0f1a",
  surface: "rgba(15, 23, 42, 0.65)",
  surfaceElevated: "rgba(17, 24, 39, 0.82)",
  border: "rgba(255, 255, 255, 0.08)",
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  blue: "#3b82f6",
  blueDeep: "#2563eb",
  purple: "#6366f1",
  purpleDeep: "#7c3aed",
  cyan: "#22d3ee",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export const officialGradients = {
  primary:
    "linear-gradient(135deg, #6366f1 0%, #4f46e5 35%, #2563eb 70%, #3b82f6 100%)",
  primaryHover:
    "linear-gradient(135deg, #818cf8 0%, #6366f1 35%, #3b82f6 70%, #60a5fa 100%)",
  sidebarActive:
    "linear-gradient(135deg, rgba(99, 102, 241, 0.42) 0%, rgba(37, 99, 235, 0.28) 100%)",
  chartLine:
    "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)",
  chartArea:
    "linear-gradient(180deg, rgba(99, 102, 241, 0.35) 0%, rgba(37, 99, 235, 0.02) 100%)",
  nebula:
    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.14) 0%, transparent 55%)",
  cosmicShell:
    "radial-gradient(ellipse 120% 80% at 80% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 10% 90%, rgba(99, 102, 241, 0.06) 0%, transparent 45%), linear-gradient(180deg, #020617 0%, #050816 100%)",
} as const;

export const officialGlow = {
  primary: "0 8px 32px rgba(99, 102, 241, 0.35)",
  card: "0 4px 24px rgba(0, 0, 0, 0.28)",
  active: "0 0 24px rgba(99, 102, 241, 0.25)",
} as const;

export const officialMotion = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeSoft: [0.45, 0, 0.55, 1] as const,
  durationFast: 0.15,
  durationNormal: 0.25,
  durationSlow: 0.4,
} as const;
