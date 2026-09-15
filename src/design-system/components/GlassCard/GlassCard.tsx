import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { officialMotion } from "../../tokens/official";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
}

const PADDING = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export function GlassCard({
  children,
  className,
  hoverable = true,
  padding = "md",
}: GlassCardProps) {
  return (
    <motion.div
      className={cn("cosmo-glass-card", PADDING[padding], className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: officialMotion.durationSlow,
        ease: officialMotion.easeOut,
      }}
      whileHover={
        hoverable
          ? { y: -2, transition: { duration: officialMotion.durationFast } }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
