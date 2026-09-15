import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DURATION, EASING } from "../animations/presets";

interface CosmoLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { shell: "h-10 w-10 rounded-xl text-xl", text: "text-base" },
  md: { shell: "h-14 w-14 rounded-2xl text-3xl", text: "text-xl" },
  lg: { shell: "h-24 w-24 rounded-[28px] text-6xl", text: "text-5xl" },
};

export function CosmoLogo({
  size = "md",
  showText = true,
  className,
}: CosmoLogoProps) {
  const config = sizes[size];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className={cn(
          "cosmo-logo-shell-premium relative flex items-center justify-center shadow-lg",
          config.shell
        )}
      >
        <motion.span
          className={cn(
            "cosmo-logo-3d flex h-full w-full items-center justify-center font-black text-white",
            config.shell
          )}
          initial={{ rotateY: -12 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: DURATION.slow, ease: EASING.smooth }}
          aria-hidden
        >
          C
        </motion.span>
      </div>

      {showText ? (
        <div>
          <h1
            className={cn(
              "font-black tracking-[0.22em] text-white",
              config.text
            )}
          >
            COSMO
          </h1>
          <p className="text-sm text-slate-400">Business AI</p>
        </div>
      ) : null}
    </div>
  );
}
