import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import {
  removeStoreAsset,
  uploadStoreAsset,
  type StoreAssetKind,
} from "./storeAsset.service";

interface MenuAssetFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind: StoreAssetKind;
  previewAlt: string;
  organizationId?: string | null;
}

export default function MenuAssetField({
  label,
  value,
  onChange,
  kind,
  previewAlt,
  organizationId = null,
}: MenuAssetFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canUpload = Boolean(organizationId);

  const cancelUpload = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setUploading(false);
    setProgress("Envio cancelado");
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
        {value ? (
          <img
            src={value}
            alt={previewAlt}
            className={
              kind === "logo"
                ? "h-16 w-16 rounded-2xl object-cover"
                : "h-full w-full object-cover"
            }
          />
        ) : (
          <span className="px-4 text-center text-xs text-slate-400">
            Sem arquivo. Envie uma imagem ou cole uma URL.
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          aria-label={kind === "logo" ? "Arquivo do logo" : "Arquivo da capa"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file || !organizationId) return;
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setError(null);
            setUploading(true);
            setProgress("Enviando…");
            void uploadStoreAsset({
              organizationId,
              kind,
              file,
              previousUrl: value,
              signal: controller.signal,
            })
              .then((result) => {
                if (controller.signal.aborted) return;
                onChange(result.publicUrl);
                setProgress("Enviado");
              })
              .catch((err) => {
                if (controller.signal.aborted) return;
                setError(
                  err instanceof Error ? err.message : "Não foi possível enviar."
                );
                setProgress(null);
              })
              .finally(() => {
                if (abortRef.current === controller) {
                  abortRef.current = null;
                  setUploading(false);
                }
              });
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!canUpload || uploading}
          aria-busy={uploading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 motion-reduce:transition-none"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          )}
          {kind === "logo" ? "Enviar logo" : "Enviar banner"}
        </button>
        {uploading ? (
          <button
            type="button"
            onClick={cancelUpload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Cancelar
          </button>
        ) : null}
        {value ? (
          <button
            type="button"
            onClick={() => {
              const previous = value;
              onChange("");
              if (organizationId) {
                void removeStoreAsset(previous, organizationId).catch(
                  () => undefined
                );
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remover
          </button>
        ) : null}
      </div>
      {progress ? (
        <p className="text-[11px] text-slate-500" role="status">
          {progress}
        </p>
      ) : null}
      {error ? (
        <p className="text-[11px] text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {!canUpload ? (
        <p className="text-[11px] text-slate-500">
          Upload disponível após o carregamento da loja. Você pode colar uma URL.
        </p>
      ) : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          kind === "logo" ? "https://… (URL do logo)" : "https://… (URL da capa)"
        }
        aria-label={kind === "logo" ? "URL do logo" : "URL da capa (banner)"}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
      />
    </div>
  );
}
