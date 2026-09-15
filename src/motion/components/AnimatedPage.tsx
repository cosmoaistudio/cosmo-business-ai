import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { pageVariants, reducedMotionVariants } from "../transitions";

interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

export default function AnimatedPage({
  children,
  className = "",
}: AnimatedPageProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? reducedMotionVariants : pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
