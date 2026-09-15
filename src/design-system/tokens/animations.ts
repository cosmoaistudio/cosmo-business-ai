export const durations = {
  instant: 100,
  fast: 150,
  normal: 250,
  slow: 400,
  counter: 800,
  shimmer: 1200,
} as const;

export const easings = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  linear: "linear",
} as const;

export const motion = {
  durations,
  easings,
} as const;

export type CosmoDuration = keyof typeof durations;
