export const DURATION = {
  instant: 0.12,
  fast: 0.2,
  normal: 0.35,
  slow: 0.55,
  slower: 0.8,
  logoSpin: 24,
} as const;

export const EASING = {
  smooth: [0.22, 1, 0.36, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
  linear: [0, 0, 1, 1] as const,
};

export const SPRING = {
  soft: { type: "spring" as const, stiffness: 260, damping: 26 },
  snappy: { type: "spring" as const, stiffness: 420, damping: 32 },
  gentle: { type: "spring" as const, stiffness: 180, damping: 22 },
};

export const motionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  slideRight: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(4px)" },
  },
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: DURATION.fast } },
  whileTap: { scale: 0.98 },
};

export const pressScale = {
  whileTap: { scale: 0.97 },
};

export const loadingPulse = {
  animate: {
    opacity: [0.45, 0.85, 0.45],
  },
  transition: {
    duration: 1.4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};
