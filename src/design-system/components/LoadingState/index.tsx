import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Carregando...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn("cosmo-v2-loading", className)}
      role="status"
      aria-live="polite"
    >
      <div className="cosmo-v2-loading__spinner" aria-hidden />
      <span className="cosmo-v2-loading__label">{label}</span>
    </div>
  );
}
