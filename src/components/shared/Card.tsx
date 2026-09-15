import type { ReactNode } from "react";
import AnimatedCard from "@/motion/components/AnimatedCard";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  animated = true,
  hover = true,
}: CardProps) {
  if (animated) {
    return (
      <AnimatedCard hover={hover} className={className}>
        {children}
      </AnimatedCard>
    );
  }

  return (
    <div className={cn("cosmo-card", className)}>
      {children}
    </div>
  );
}
