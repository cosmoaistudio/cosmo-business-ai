import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SidebarLogo } from "./SidebarLogo";
import { SidebarToggle } from "./SidebarToggle";

export interface SidebarShellProps {
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SidebarShell({
  collapsed,
  onToggle,
  children,
  footer,
  className,
}: SidebarShellProps) {
  return (
    <aside
      data-cosmo-ds="v2"
      data-theme="dark"
      className={cn(
        "cosmo-v2-sidebar",
        collapsed && "cosmo-v2-sidebar--collapsed",
        className
      )}
    >
      <div className="cosmo-v2-sidebar__header">
        <SidebarLogo collapsed={collapsed} />
      </div>

      <nav className="cosmo-v2-sidebar__nav" aria-label="Navegação principal">
        {children}
      </nav>

      <div className="cosmo-v2-sidebar__footer">
        {footer}
        <SidebarToggle collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  );
}
