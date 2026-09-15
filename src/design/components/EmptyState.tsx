import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionVariants } from "../animations/presets";

export function DesignEmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      {...motionVariants.fade}
      className={cn(
        "cosmo-premium-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {icon ? <div className="mb-4 text-slate-400">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
