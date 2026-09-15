import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  glass?: boolean;
  hoverable?: boolean;
  static?: boolean;
}

const paddingClass = {
  sm: "cosmo-v2-card--padding-sm",
  md: "cosmo-v2-card--padding-md",
  lg: "cosmo-v2-card--padding-lg",
};

export function Card({
  padding = "md",
  glass = false,
  hoverable = true,
  static: isStatic = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "cosmo-v2-card",
        paddingClass[padding],
        glass && "cosmo-v2-card--glass",
        hoverable && !isStatic && "cosmo-v2-card--hoverable",
        isStatic && "cosmo-v2-card--static",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
