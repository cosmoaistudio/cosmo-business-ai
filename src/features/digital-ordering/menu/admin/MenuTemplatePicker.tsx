import { useMemo, useState } from "react";
import { listMenuTemplates } from "../templates/menuTemplateRegistry";
import { getTemplateGalleryMeta } from "../templates/templateGalleryMeta";
import type { MenuTemplateId } from "../types/menuTemplate.types";
import MenuEditorSection from "./editor/MenuEditorSection";
import MenuTemplateCard from "./editor/MenuTemplateCard";

interface MenuTemplatePickerProps {
  value: MenuTemplateId;
  onChange: (templateId: MenuTemplateId) => void;
}

type GalleryFilter = "all" | "Alimentação" | "Serviços" | "Varejo" | "Geral";

/**
 * Commercial template gallery — driven only by menuTemplateRegistry.
 */
export default function MenuTemplatePicker({
  value,
  onChange,
}: MenuTemplatePickerProps) {
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [compareIds, setCompareIds] = useState<MenuTemplateId[]>([]);
  const templates = listMenuTemplates();

  const filtered = useMemo(() => {
    if (filter === "all") return templates;
    return templates.filter(
      (entry) => getTemplateGalleryMeta(entry).categoryLabel === filter
    );
  }, [filter, templates]);

  const filters: GalleryFilter[] = [
    "all",
    "Alimentação",
    "Serviços",
    "Varejo",
    "Geral",
  ];

  return (
    <MenuEditorSection
      title="Escolha o estilo do seu negócio"
      description="Cada template define composição, textos e recursos. Cores e identidade continuam editáveis depois."
    >
      <div
        className="mb-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filtrar templates"
      >
        {filters.map((entry) => {
          const active = filter === entry;
          return (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(entry)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {entry === "all" ? "Todos" : entry}
            </button>
          );
        })}
      </div>

      {compareIds.length > 0 ? (
        <p className="mb-3 text-xs text-slate-500">
          Comparando {compareIds.length} template{compareIds.length > 1 ? "s" : ""}.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template) => (
          <MenuTemplateCard
            key={template.id}
            template={template}
            selected={template.id === value}
            comparing={compareIds.includes(template.id)}
            onSelect={() => onChange(template.id)}
            onCompare={() => {
              setCompareIds((current) => {
                if (current.includes(template.id)) {
                  return current.filter((id) => id !== template.id);
                }
                return [...current, template.id].slice(-2);
              });
            }}
          />
        ))}
      </div>
    </MenuEditorSection>
  );
}
