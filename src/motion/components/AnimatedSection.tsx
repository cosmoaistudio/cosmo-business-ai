import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { reducedMotionVariants, sectionVariants } from "../transitions";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: AnimatedSectionProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <motion.section
      variants={reducedMotion ? reducedMotionVariants : sectionVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
