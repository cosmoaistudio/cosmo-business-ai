import { type ReactNode } from "react";

import { Card } from "../Card";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card hoverable={false} static className={className}>
      <div className="cosmo-v2-empty">
        {icon ? <div className="cosmo-v2-empty__icon">{icon}</div> : null}
        <h3 className="cosmo-v2-empty__title">{title}</h3>
        {description ? (
          <p className="cosmo-v2-empty__description">{description}</p>
        ) : null}
        {action ? <div>{action}</div> : null}
      </div>
    </Card>
  );
}
