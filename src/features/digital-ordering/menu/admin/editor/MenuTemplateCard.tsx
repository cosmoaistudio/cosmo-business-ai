import { Check } from "lucide-react";
import type { MenuTemplate } from "../../types/menuTemplate.types";
import { getTemplateGalleryMeta } from "../../templates/templateGalleryMeta";
import { radiusToCss } from "../../theme/menuTheme";

interface MenuTemplateCardProps {
  template: MenuTemplate;
  selected: boolean;
  comparing?: boolean;
  onSelect: () => void;
  onCompare?: () => void;
}

export default function MenuTemplateCard({
  template,
  selected,
  comparing = false,
  onSelect,
  onCompare,
}: MenuTemplateCardProps) {
  const [a, b, c] = template.preview.swatch;
  const gallery = getTemplateGalleryMeta(template);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition duration-200 motion-reduce:transition-none ${
        selected
          ? "border-slate-900 ring-2 ring-slate-900/15"
          : comparing
            ? "border-slate-400 ring-2 ring-slate-400/20"
            : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:hover:translate-y-0"
      }`}
    >
      <div
        className="relative h-28 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${a} 0%, ${b} 55%, ${c} 100%)`,
        }}
        aria-hidden
      >
        <div className="absolute inset-x-3 bottom-3 flex gap-2">
          <span
            className="h-12 flex-1 bg-white/90 shadow-sm"
            style={{ borderRadius: radiusToCss("md") }}
          />
          <span
            className="h-12 w-12 bg-white/70 shadow-sm"
            style={{ borderRadius: radiusToCss("md") }}
          />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {gallery.categoryLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{template.name}</p>
            <p className="text-xs font-medium text-slate-500">
              {gallery.styleLabel}
            </p>
          </div>
          {selected ? (
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <Check className="h-3 w-3" aria-hidden />
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{gallery.pitch}</p>
        {gallery.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {gallery.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <dl className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
          <div>Densidade · {gallery.density}</div>
          <div>Card · {gallery.cardStyle}</div>
          <div>Preço · {gallery.pricePosition}</div>
          <div>CTA · {gallery.ctaPosition}</div>
        </dl>
        {onCompare ? (
          <button
            type="button"
            onClick={onCompare}
            aria-pressed={comparing}
            className="text-left text-[11px] font-semibold text-slate-500 underline-offset-2 hover:underline"
          >
            {comparing ? "Remover da comparação" : "Comparar"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={
            selected
              ? `${template.name} selecionado`
              : `Usar template ${template.name}`
          }
          className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${
            selected
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-800 hover:bg-slate-200"
          }`}
        >
          {selected ? "Template em uso" : "Usar template"}
        </button>
      </div>
    </article>
  );
}
