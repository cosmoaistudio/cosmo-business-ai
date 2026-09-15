import { cn } from "@/lib/utils";

export interface SidebarNavGroupProps {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SidebarNavGroup({
  label,
  collapsed = false,
  children,
  className,
}: SidebarNavGroupProps) {
  return (
    <div className={cn("cosmo-v2-sidebar__group", className)}>
      {!collapsed ? (
        <p className="cosmo-v2-sidebar__group-label">{label}</p>
      ) : (
        <div className="cosmo-v2-sidebar__group-divider" aria-hidden />
      )}
      <div className="cosmo-v2-sidebar__group-items">{children}</div>
    </div>
  );
}
