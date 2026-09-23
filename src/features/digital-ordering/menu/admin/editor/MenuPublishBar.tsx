import { Eye, Loader2, Save, Upload } from "lucide-react";

interface MenuPublishBarProps {
  isDirty: boolean;
  saving?: boolean;
  publishing?: boolean;
  saved?: boolean;
  published?: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDiscard?: () => void;
  onPreview?: () => void;
  error?: string | null;
  publishError?: string | null;
  offline?: boolean;
}

/**
 * Save vs Publish — same backend flows, clearer SaaS chrome.
 */
export default function MenuPublishBar({
  isDirty,
  saving = false,
  publishing = false,
  saved = false,
  published = false,
  onSave,
  onPublish,
  onDiscard,
  onPreview,
  error = null,
  publishError = null,
  offline = false,
}: MenuPublishBarProps) {
  const status = offline ? (
    <span className="text-xs font-medium text-amber-700" role="status">
      Offline / conexão perdida
    </span>
  ) : publishError ? (
    <span className="text-xs font-medium text-rose-600" role="alert">
      Erro ao publicar
    </span>
  ) : error ? (
    <span className="text-xs font-medium text-rose-600" role="alert">
      Erro ao salvar
    </span>
  ) : publishing ? (
    <span className="text-xs font-medium text-slate-600">Publicando…</span>
  ) : saving ? (
    <span className="text-xs font-medium text-slate-600">Salvando…</span>
  ) : isDirty ? (
    <span className="text-xs font-medium text-amber-700">
      ● Alterações não publicadas
    </span>
  ) : published ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <span aria-hidden>✓</span>
      Publicado
    </span>
  ) : saved ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <span aria-hidden>✓</span>
      Salvo
    </span>
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status}

      {isDirty && onDiscard ? (
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-reduce:transition-none"
        >
          Descartar
        </button>
      ) : null}

      {onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-reduce:transition-none"
        >
          <Eye className="h-4 w-4" aria-hidden />
          Visualizar
        </button>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={saving || !isDirty || offline}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-reduce:transition-none"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        {saving ? "Salvando…" : saved && !isDirty ? "Salvo!" : "Salvar"}
      </button>

      <button
        type="button"
        onClick={onPublish}
        disabled={publishing || offline}
        aria-busy={publishing}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition duration-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 motion-reduce:transition-none"
      >
        {publishing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="h-4 w-4" aria-hidden />
        )}
        {publishing ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}
