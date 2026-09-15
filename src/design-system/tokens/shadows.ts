export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.24)",
  md: "0 4px 16px rgba(0, 0, 0, 0.28)",
  lg: "0 12px 40px rgba(0, 0, 0, 0.32)",
  intelligence: "0 0 24px rgba(139, 92, 246, 0.35)",
} as const;

export type CosmoShadow = keyof typeof shadows;
