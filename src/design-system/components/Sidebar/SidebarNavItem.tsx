import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { durations } from "../../tokens";
import { Tooltip } from "../Tooltip";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
  end?: boolean;
  badge?: string;
}

export function SidebarNavItem({
  to,
  label,
  icon: Icon,
  collapsed = false,
  end = false,
  badge,
}: SidebarNavItemProps) {
  const tooltip = badge ? `${label} (${badge})` : label;

  const link = (
    <NavLink to={to} end={end} className="cosmo-v2-sidebar__link">
      {({ isActive }) => (
        <motion.span
          className={cn(
            "cosmo-v2-sidebar__item cosmo-v2-focusable",
            isActive && "cosmo-v2-sidebar__item--active"
          )}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            duration: durations.fast / 1000,
            ease: EASE_OUT,
          }}
        >
          {isActive ? <span className="cosmo-v2-sidebar__active-bar" aria-hidden /> : null}
          <Icon
            size={20}
            strokeWidth={isActive ? 2.25 : 1.75}
            className="cosmo-v2-sidebar__icon"
            aria-hidden
          />
          {!collapsed ? (
            <>
              <span className="cosmo-v2-sidebar__label">{label}</span>
              {badge ? (
                <span className="cosmo-v2-sidebar__item-badge">{badge}</span>
              ) : null}
            </>
          ) : null}
        </motion.span>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip content={tooltip} placement="right">
        {link}
      </Tooltip>
    );
  }

  return link;
}
