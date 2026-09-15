import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "intelligence";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: "cosmo-v2-badge--default",
  primary: "cosmo-v2-badge--primary",
  success: "cosmo-v2-badge--success",
  warning: "cosmo-v2-badge--warning",
  danger: "cosmo-v2-badge--danger",
  intelligence: "cosmo-v2-badge--intelligence",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span className={cn("cosmo-v2-badge", variantClass[variant], className)}>
      {children}
    </span>
  );
}
