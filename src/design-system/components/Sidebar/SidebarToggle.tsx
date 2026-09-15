import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { durations } from "../../tokens";
import { Tooltip } from "../Tooltip";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface SidebarToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggle({
  collapsed,
  onToggle,
  className,
}: SidebarToggleProps) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? "Expandir sidebar" : "Recolher sidebar";

  const button = (
    <motion.button
      type="button"
      onClick={onToggle}
      className={cn(
        "cosmo-v2-sidebar__toggle cosmo-v2-focusable",
        className
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        duration: durations.fast / 1000,
        ease: EASE_OUT,
      }}
      aria-label={label}
      aria-expanded={!collapsed}
    >
      <Icon size={18} strokeWidth={1.75} />
      {!collapsed ? (
        <span className="cosmo-v2-sidebar__toggle-label">Recolher</span>
      ) : null}
    </motion.button>
  );

  if (collapsed) {
    return <Tooltip content={label} placement="right">{button}</Tooltip>;
  }

  return button;
}
