import { cn } from "@/lib/utils";

type BadgeTone = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-white/10 text-slate-200 border-white/10",
  primary: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  secondary: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  danger: "bg-red-500/15 text-red-300 border-red-500/20",
};

export function DesignBadge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
