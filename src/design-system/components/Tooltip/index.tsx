import { cn } from "@/lib/utils";

export type TooltipPlacement = "top" | "right" | "bottom";

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
  placement?: TooltipPlacement;
}

const placementClass: Record<TooltipPlacement, string> = {
  top: "cosmo-v2-tooltip--top",
  right: "cosmo-v2-tooltip--right",
  bottom: "cosmo-v2-tooltip--bottom",
};

export function Tooltip({
  children,
  content,
  className,
  placement = "bottom",
}: TooltipProps) {
  return (
    <span
      className={cn(
        "cosmo-v2-tooltip",
        placementClass[placement],
        className
      )}
    >
      {children}
      <span className="cosmo-v2-tooltip__content" role="tooltip">
        {content}
      </span>
    </span>
  );
}
