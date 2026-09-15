import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function PageContainer({
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("cosmo-v2-page", className)} {...props}>
      {children}
    </div>
  );
}
