import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { durations } from "../../tokens";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface SidebarLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function SidebarLogo({ collapsed = false, className }: SidebarLogoProps) {
  return (
    <div
      className={cn(
        "cosmo-v2-sidebar__logo",
        collapsed && "cosmo-v2-sidebar__logo--collapsed",
        className
      )}
    >
      <motion.div
        className="cosmo-v2-sidebar__logo-mark"
        whileHover={{ scale: 1.04 }}
        transition={{
          duration: durations.fast / 1000,
          ease: EASE_OUT,
        }}
      >
        <span aria-hidden>C</span>
      </motion.div>

      {!collapsed ? (
        <motion.div
          className="cosmo-v2-sidebar__logo-text"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: durations.normal / 1000,
            ease: EASE_OUT,
          }}
        >
          <span className="cosmo-v2-sidebar__logo-title">Cosmo</span>
          <span className="cosmo-v2-sidebar__logo-subtitle">Business AI</span>
        </motion.div>
      ) : null}
    </div>
  );
}
