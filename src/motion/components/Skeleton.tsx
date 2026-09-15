import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("cosmo-skeleton rounded-xl", className)}
      aria-hidden
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-3",
            index === lines - 1 ? "w-2/3" : index === 0 ? "w-full" : "w-4/5"
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("cosmo-card p-6", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="mt-6 h-8 w-2/5" />
      <Skeleton className="mt-3 h-4 w-1/2" />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  label?: string;
}

export function SkeletonTable({
  rows = 5,
  label = "Carregando dados",
}: SkeletonTableProps) {
  return (
    <div
      className="space-y-3 p-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-slate-100/80 bg-white/60 px-4 py-3"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  className?: string;
}

export function SkeletonGrid({ count = 4, className }: SkeletonGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

interface SkeletonPageProps {
  label?: string;
}

export function SkeletonPage({ label = "Carregando" }: SkeletonPageProps) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="sr-only">{label}...</span>
      <Skeleton className="h-10 w-64 rounded-2xl" />
      <Skeleton className="h-5 w-96 max-w-full rounded-xl" />
      <SkeletonGrid count={4} />
      <div className="grid gap-6 xl:grid-cols-2">
        <SkeletonCard className="min-h-[280px]" />
        <SkeletonCard className="min-h-[280px]" />
      </div>
    </div>
  );
}
