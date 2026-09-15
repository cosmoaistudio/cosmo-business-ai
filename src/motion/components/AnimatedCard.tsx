import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { cardVariants, reducedMotionVariants } from "../transitions";
import { SCALE } from "../animationTokens";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function AnimatedCard({
  children,
  className = "",
  hover = true,
}: AnimatedCardProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <motion.div
      variants={reducedMotion ? reducedMotionVariants : cardVariants}
      whileHover={
        hover && !reducedMotion
          ? { y: -3, scale: SCALE.hover, transition: { duration: 0.2 } }
          : undefined
      }
      className={cn("cosmo-card", className)}
    >
      {children}
    </motion.div>
  );
}
