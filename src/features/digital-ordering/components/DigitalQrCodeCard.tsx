import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { DigitalQrCodeEntry } from "../types/digitalStore.types";

interface DigitalQrCodeCardProps {
  entry: DigitalQrCodeEntry;
  imageUrl: string;
}

export default function DigitalQrCodeCard({
  entry,
  imageUrl,
}: DigitalQrCodeCardProps) {
  const copyUrl = async () => {
    await navigator.clipboard.writeText(entry.url);
    toast.success("Link copiado.");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{entry.label}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {entry.type}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            title="Copiar link"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={entry.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            title="Abrir"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <img
        src={imageUrl}
        alt={`QR Code ${entry.label}`}
        className="mx-auto h-44 w-44 rounded-2xl border border-slate-100 bg-white p-2"
      />

      <p className="mt-3 break-all text-xs text-slate-500">{entry.url}</p>
    </div>
  );
}
