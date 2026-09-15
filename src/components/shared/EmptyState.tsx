import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]">
          <Icon className="h-7 w-7 text-slate-400" aria-hidden />
        </div>
      ) : null}

      <p className="text-base font-semibold text-slate-100">{title}</p>

      {description ? (
        <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
