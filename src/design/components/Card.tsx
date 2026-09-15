import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { hoverLift } from "../animations/presets";

interface DesignCardProps extends HTMLMotionProps<"div"> {
  premium?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function DesignCard({
  premium = true,
  padding = "md",
  className,
  children,
  ...props
}: DesignCardProps) {
  return (
    <motion.div
      {...hoverLift}
      className={cn(
        premium ? "cosmo-premium-card" : "rounded-2xl border border-white/10 bg-slate-900/50",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
