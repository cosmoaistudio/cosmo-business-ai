import { type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "intelligence"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "cosmo-v2-btn--primary",
  secondary: "cosmo-v2-btn--secondary",
  ghost: "cosmo-v2-btn--ghost",
  intelligence: "cosmo-v2-btn--intelligence",
  danger: "cosmo-v2-btn--danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "cosmo-v2-btn--sm",
  md: "cosmo-v2-btn--md",
  lg: "cosmo-v2-btn--lg",
  icon: "cosmo-v2-btn--icon",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "cosmo-v2-btn cosmo-v2-focusable",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {loading ? "Aguarde..." : children}
    </button>
  );
}
