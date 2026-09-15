export const DURATION = {
  instant: 0.12,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  slower: 0.65,
  logoSpin: 22,
} as const;

export const EASING = {
  smooth: [0.22, 1, 0.36, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  linear: [0, 0, 1, 1] as const,
};

export const SPRING = {
  soft: { type: "spring" as const, stiffness: 260, damping: 26 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 180, damping: 22 },
};

export const STAGGER = {
  fast: 0.04,
  normal: 0.06,
  slow: 0.08,
};

export const SCALE = {
  hover: 1.02,
  press: 0.98,
  logoHover: 1.04,
};

export const DISTANCE = {
  sm: 8,
  md: 16,
  lg: 24,
};
