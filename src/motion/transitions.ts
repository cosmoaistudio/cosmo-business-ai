import type { Transition, Variants } from "framer-motion";
import { DISTANCE, DURATION, EASING, STAGGER } from "./animationTokens";

export const fadeTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.smooth,
};

export const slideTransition: Transition = {
  duration: DURATION.slow,
  ease: EASING.out,
};

export const scaleTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.smooth,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fadeTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: DISTANCE.md },
  visible: { opacity: 1, y: 0, transition: slideTransition },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -DISTANCE.md },
  visible: { opacity: 1, y: 0, transition: slideTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: scaleTransition },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: DISTANCE.lg },
  visible: { opacity: 1, y: 0, transition: slideTransition },
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE.sm },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.slow,
      ease: EASING.smooth,
      when: "beforeChildren",
      staggerChildren: STAGGER.normal,
    },
  },
};

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE.md },
  visible: {
    opacity: 1,
    y: 0,
    transition: slideTransition,
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE.md, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.slow,
      ease: EASING.out,
    },
  },
};

export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.normal,
      delayChildren: 0.04,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: DISTANCE.sm },
  visible: {
    opacity: 1,
    y: 0,
    transition: fadeTransition,
  },
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};
