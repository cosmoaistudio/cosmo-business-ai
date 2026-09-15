import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("cosmo-v2-section", className)}>
      {title ? <h2 className="cosmo-v2-section__title">{title}</h2> : null}
      {description ? (
        <p className="cosmo-v2-section__description">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
