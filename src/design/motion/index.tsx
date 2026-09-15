import { motion, type HTMLMotionProps } from "framer-motion";
import { DURATION, EASING, motionVariants } from "../animations/presets";

export function Fade({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={motionVariants.fade.initial}
      animate={motionVariants.fade.animate}
      exit={motionVariants.fade.exit}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Scale({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={motionVariants.scale.initial}
      animate={motionVariants.scale.animate}
      exit={motionVariants.scale.exit}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Slide({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={motionVariants.slideUp.initial}
      animate={motionVariants.slideUp.animate}
      exit={motionVariants.slideUp.exit}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Blur({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={motionVariants.blur.initial}
      animate={motionVariants.blur.animate}
      exit={motionVariants.blur.exit}
      transition={{ duration: DURATION.slow, ease: EASING.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Hover({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} {...props}>
      {children}
    </motion.div>
  );
}

export function Press({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} {...props}>
      {children}
    </motion.div>
  );
}

export function LoadingMotion({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
