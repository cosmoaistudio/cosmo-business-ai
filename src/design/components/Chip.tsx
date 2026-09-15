import { cn } from "@/lib/utils";

export function DesignChip({
  label,
  selected = false,
  onClick,
  className,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        selected
          ? "border-blue-500/40 bg-blue-500/15 text-blue-200 shadow-sm shadow-blue-500/10"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200",
        className
      )}
    >
      {label}
    </button>
  );
}
