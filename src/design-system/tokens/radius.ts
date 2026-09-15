export const radius = {
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.25rem", // 20px
  full: "9999px",
} as const;

export type CosmoRadius = keyof typeof radius;
