import { useRef } from "react";
import { Loader2, QrCode, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import DigitalQrCodePanel from "@/features/digital-ordering/components/DigitalQrCodePanel";
import DigitalStoreSettingsForm from "@/features/digital-ordering/components/DigitalStoreSettingsForm";
import { useDigitalOrderingSettings } from "@/features/digital-ordering/hooks/useDigitalOrderingSettings";
import {
  ContextualSetupBanner,
  useContextualSetup,
} from "@/features/operation-onboarding";

export default function DigitalOrderingSettingsPage() {
  const {
    settings,
    tables,
    qrCodes,
    publishing,
    saved,
    saveSettings,
    saveTables,
    publishCatalog,
  } = useDigitalOrderingSettings();

  const {
    presentation,
    dismiss,
    acknowledgeSuccess,
    refreshAfterAction,
  } = useContextualSetup({
    relevantStepIds: ["digital_order"],
  });

  const formRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);

  if (!settings) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handlePublish = async () => {
    try {
      const products = await publishCatalog();
      toast.success(`Cardápio publicado com ${products.length} produtos.`);
      await refreshAfterAction();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao publicar cardápio."
      );
    }
  };

  const focusSetup = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      publishRef.current?.focus();
    }, 350);
  };

  return (
    <div className="space-y-8">
      <ContextualSetupBanner
        presentation={presentation}
        icon={<QrCode size={18} />}
        ctaLabel="Configurar pedido digital"
        onPrimaryAction={focusSetup}
        onDismiss={dismiss}
        onAcknowledgeSuccess={acknowledgeSuccess}
      />

      <PageHeader
        title="Pedido Digital"
        subtitle="Configure sua loja online, QR Codes e autoatendimento."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void saveSettings(settings)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              {saved ? "Salvo!" : "Salvar"}
            </button>
            <button
              ref={publishRef}
              type="button"
              onClick={() => void handlePublish()}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Publicar cardápio
            </button>
          </div>
        }
      />

      <div
        ref={formRef}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <DigitalStoreSettingsForm
          settings={settings}
          tables={tables}
          onChange={saveSettings}
          onTablesChange={saveTables}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">QR Codes</h2>
          <p className="text-sm text-slate-500">
            Mesa, retirada, delivery e evento — gerados automaticamente por loja.
          </p>
        </div>
        <DigitalQrCodePanel qrCodes={qrCodes} />
      </section>
    </div>
  );
}
