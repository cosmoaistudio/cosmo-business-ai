import type { MenuPreviewSelectable } from "./menuEditor.types";
import { PREVIEW_SELECTABLE_TO_SECTION } from "./previewSelectMap";

interface MenuPreviewSelectionLayerProps {
  active?: MenuPreviewSelectable | null;
  selectMode?: boolean;
  onSelect: (target: MenuPreviewSelectable) => void;
}

const REGIONS: Array<{
  id: MenuPreviewSelectable;
  label: string;
  className: string;
}> = [
  {
    id: "header",
    label: "Selecionar cabeçalho",
    className: "left-2 right-2 top-2 h-[12%]",
  },
  {
    id: "banner",
    label: "Selecionar banner",
    className: "left-2 right-2 top-[14%] h-[18%]",
  },
  {
    id: "catalog",
    label: "Selecionar catálogo",
    className: "left-2 right-[28%] top-[34%] bottom-14",
  },
  {
    id: "card",
    label: "Selecionar cards",
    className: "right-2 top-[34%] bottom-14 w-[24%]",
  },
  {
    id: "button",
    label: "Selecionar botões",
    className: "left-2 right-2 bottom-2 h-10",
  },
];

/**
 * Visual selection infrastructure over the live preview.
 * Stage 1: region hotspots that open the matching editor section.
 * Does not mutate the public menu DOM tree.
 */
export default function MenuPreviewSelectionLayer({
  active = null,
  selectMode = false,
  onSelect,
}: MenuPreviewSelectionLayerProps) {
  if (!selectMode) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      data-menu-preview-selection="true"
      aria-hidden={false}
    >
      {REGIONS.map((region) => {
        const isActive = active === region.id;
        return (
          <button
            key={region.id}
            type="button"
            aria-label={`${region.label} (${PREVIEW_SELECTABLE_TO_SECTION[region.id]})`}
            aria-pressed={isActive}
            onClick={() => onSelect(region.id)}
            className={`pointer-events-auto absolute rounded-xl border-2 transition duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
              isActive
                ? "border-white bg-white/15 shadow-[0_0_0_1px_rgba(15,23,42,0.35)]"
                : "border-white/40 bg-transparent hover:border-white hover:bg-white/10"
            } ${region.className}`}
          />
        );
      })}
    </div>
  );
}
