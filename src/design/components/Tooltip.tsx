import { cn } from "@/lib/utils";

export function DesignTooltip({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("group relative inline-flex", className)}>
      {children}
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 scale-95 rounded-lg border border-white/10 bg-[#0B1020] px-2.5 py-1 text-xs text-slate-200 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}
