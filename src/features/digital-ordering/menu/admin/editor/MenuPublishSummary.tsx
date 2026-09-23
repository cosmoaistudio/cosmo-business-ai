import { useEffect } from "react";
import type { DigitalStoreSettings } from "../../../types/digitalStore.types";
import type { MenuTheme } from "../../types/digitalMenu.types";
import type { MenuTemplateId } from "../../types/menuTemplate.types";

interface MenuPublishSummaryProps {
  open: boolean;
  settings: DigitalStoreSettings;
  theme: MenuTheme;
  templateName: string;
  templateId: MenuTemplateId;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function MenuPublishSummary({
  open,
  settings,
  theme,
  templateName,
  onCancel,
  onConfirm,
}: MenuPublishSummaryProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-summary-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Rascunho → Salvar → Publicar → Menu público
        </p>
        <h2
          id="publish-summary-title"
          className="mt-2 text-base font-semibold text-slate-900"
        >
          Publicar apresentação?
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Só a aparência do cardápio muda. Produtos e pedidos permanecem.
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">Template</dt>
            <dd className="font-medium text-slate-900">{templateName}</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">Identidade</dt>
            <dd className="truncate font-medium text-slate-900">
              {settings.organizationName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">Cores</dt>
            <dd className="flex gap-1.5">
              {[theme.primaryColor, theme.secondaryColor, theme.accentColor].map(
                (color) => (
                  <span
                    key={color}
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">Layout</dt>
            <dd className="font-medium text-slate-900">
              {theme.productLayout} · {theme.density}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">Banner</dt>
            <dd className="font-medium text-slate-900">{theme.bannerStyle}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}
