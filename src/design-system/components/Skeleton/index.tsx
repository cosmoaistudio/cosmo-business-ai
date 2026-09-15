import { cn } from "@/lib/utils";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  className,
  rounded = true,
}: SkeletonProps) {
  return (
    <div
      className={cn("cosmo-v2-skeleton", className)}
      style={{
        width,
        height,
        borderRadius: rounded ? undefined : 0,
      }}
      aria-hidden
    />
  );
}
