import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface OsPanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function OsPanel({
  title,
  description,
  action,
  children,
  className,
  padding = true,
}: OsPanelProps) {
  return (
    <motion.section
      className={cn("cosmo-os-panel", padding && "p-5 sm:p-6", className)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {(title || action) && (
        <div className="cosmo-os-panel__head">
          <div>
            {title && <h2 className="cosmo-os-panel__title">{title}</h2>}
            {description && (
              <p className="cosmo-os-panel__desc">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}
