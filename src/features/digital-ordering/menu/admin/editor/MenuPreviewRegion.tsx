import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { PREVIEW_SELECTABLE_LABELS } from "./previewSelectMap";
import { useMenuPreviewSelect } from "./MenuPreviewSelectContext";
import type { MenuPreviewSelectable } from "./menuEditor.types";

interface MenuPreviewRegionProps {
  id: MenuPreviewSelectable;
  children: ReactNode;
  className?: string;
}

/**
 * Real-component selection chrome. No-op on the public menu (no context).
 * Active only in preview edit mode.
 */
export default function MenuPreviewRegion({
  id,
  children,
  className = "",
}: MenuPreviewRegionProps) {
  const ctx = useMenuPreviewSelect();
  if (!ctx?.enabled) return <>{children}</>;

  const selected = ctx.selected === id;
  const label = PREVIEW_SELECTABLE_LABELS[id];

  const select = () => ctx.onSelect(id);

  const onClickCapture = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    select();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    select();
  };

  return (
    <div
      data-preview-select={id}
      role="group"
      aria-label={`Selecionar ${label}`}
      aria-current={selected ? "true" : undefined}
      tabIndex={0}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      className={`menu-preview-region relative outline-none transition duration-200 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        selected
          ? "z-[15] ring-2 ring-white/90 ring-offset-2 ring-offset-slate-900"
          : "hover:ring-2 hover:ring-white/45"
      } ${className}`}
    >
      {selected ? (
        <div
          role="toolbar"
          aria-label={`Ações de ${label}`}
          className="pointer-events-none absolute left-1.5 top-1.5 z-20 flex items-center gap-1.5"
        >
          <span className="rounded-md bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {label}
          </span>
          <button
            type="button"
            className="pointer-events-auto rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-900 transition duration-200 motion-reduce:transition-none"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              select();
            }}
          >
            Editar
          </button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
