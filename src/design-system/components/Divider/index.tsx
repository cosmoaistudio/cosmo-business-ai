import { cn } from "@/lib/utils";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({
  orientation = "horizontal",
  className,
}: DividerProps) {
  return (
    <hr
      className={cn(
        "cosmo-v2-divider",
        orientation === "horizontal"
          ? "cosmo-v2-divider--horizontal"
          : "cosmo-v2-divider--vertical",
        className
      )}
    />
  );
}
