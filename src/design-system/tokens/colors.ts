export const palette = {
  bg: {
    base: "#030712",
    elevated: "#0A0F1A",
    surface: "#111827",
    muted: "#1F2937",
    overlay: "rgba(3, 7, 18, 0.72)",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    default: "rgba(255, 255, 255, 0.10)",
    strong: "rgba(255, 255, 255, 0.16)",
  },
  text: {
    primary: "#F9FAFB",
    secondary: "#9CA3AF",
    tertiary: "#6B7280",
    inverse: "#030712",
  },
  accent: {
    blue: "#3B82F6",
    blueHover: "#2563EB",
    blueMuted: "rgba(59, 130, 246, 0.12)",
  },
  intelligence: {
    purple: "#8B5CF6",
    purpleHover: "#7C3AED",
    purpleMuted: "rgba(139, 92, 246, 0.12)",
  },
  success: {
    DEFAULT: "#10B981",
    muted: "rgba(16, 185, 129, 0.12)",
  },
  warning: {
    DEFAULT: "#F97316",
    muted: "rgba(249, 115, 22, 0.12)",
  },
  danger: {
    DEFAULT: "#EF4444",
    muted: "rgba(239, 68, 68, 0.12)",
  },
} as const;

export const lightPalette = {
  bg: {
    base: "#F9FAFB",
    elevated: "#FFFFFF",
    surface: "#FFFFFF",
    muted: "#F3F4F6",
    overlay: "rgba(15, 23, 42, 0.4)",
  },
  border: {
    subtle: "rgba(15, 23, 42, 0.06)",
    default: "rgba(15, 23, 42, 0.10)",
    strong: "rgba(15, 23, 42, 0.16)",
  },
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#F9FAFB",
  },
  accent: {
    blue: "#2563EB",
    blueHover: "#1D4ED8",
    blueMuted: "rgba(37, 99, 235, 0.12)",
  },
  intelligence: {
    purple: "#7C3AED",
    purpleHover: "#6D28D9",
    purpleMuted: "rgba(124, 58, 237, 0.12)",
  },
  success: {
    DEFAULT: "#059669",
    muted: "rgba(5, 150, 105, 0.12)",
  },
  warning: {
    DEFAULT: "#EA580C",
    muted: "rgba(234, 88, 12, 0.12)",
  },
  danger: {
    DEFAULT: "#DC2626",
    muted: "rgba(220, 38, 38, 0.12)",
  },
} as const;

export type CosmoPalette = typeof palette;
