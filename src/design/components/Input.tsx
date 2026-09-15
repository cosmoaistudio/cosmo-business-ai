import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const DesignInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function DesignInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "cosmo-input h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none",
        className
      )}
      {...props}
    />
  );
});
