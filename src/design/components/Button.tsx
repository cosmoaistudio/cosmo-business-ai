import { type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRipple } from "@/motion/hooks/useRipple";

type DesignButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type DesignButtonSize = "sm" | "md" | "lg" | "icon";

interface DesignButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DesignButtonVariant;
  size?: DesignButtonSize;
  loading?: boolean;
}

const variantClasses: Record<DesignButtonVariant, string> = {
  primary:
    "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-lg shadow-blue-600/25 border border-blue-500/20",
  secondary:
    "bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-violet-600/20 border border-violet-500/20",
  ghost:
    "bg-white/5 text-slate-200 hover:bg-white/10 border border-white/10",
  danger:
    "bg-[#EF4444] text-white hover:bg-red-600 border border-red-500/20",
};

const sizeClasses: Record<DesignButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
  icon: "h-10 w-10 rounded-xl",
};

export function DesignButton({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  onClick,
  onPointerDown,
  ...props
}: DesignButtonProps) {
  const { ripples, createRipple } = useRipple();

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "cosmo-button relative inline-flex items-center justify-center gap-2 overflow-hidden font-semibold transition-colors disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onPointerDown={(event) => {
        createRipple(event);
        onPointerDown?.(event);
      }}
      onClick={onClick}
      type={props.type ?? "button"}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="cosmo-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {loading ? "Aguarde..." : children}
    </motion.button>
  );
}
