export const gradients = {
  primary: "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #06B6D4 100%)",
  secondary: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
  surface: "linear-gradient(180deg, #0B1020 0%, #050816 100%)",
  hero: "radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 42%)",
  cardShine:
    "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 48%, rgba(37,99,235,0.04) 100%)",
  logo: "linear-gradient(135deg, #2563EB 0%, #3B82F6 45%, #7C3AED 100%)",
} as const;

export type DesignGradient = keyof typeof gradients;
