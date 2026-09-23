import type { ReactNode } from "react";

interface MenuEditorSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * One job per section — title, short support line, optional actions.
 */
export default function MenuEditorSection({
  title,
  description,
  children,
  actions,
}: MenuEditorSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="max-w-xl text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
