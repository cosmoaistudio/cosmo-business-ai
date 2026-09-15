import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DesignLoading({
  label = "Carregando...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-10", className)}>
      <motion.div
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" as const }}
        className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-600/25"
      />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export function DesignSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-blue-500",
        className
      )}
    />
  );
}
