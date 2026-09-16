import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, QrCode, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import DigitalQrCodePanel from "@/features/digital-ordering/components/DigitalQrCodePanel";
import DigitalStoreSettingsForm from "@/features/digital-ordering/components/DigitalStoreSettingsForm";
import MenuConfigurator from "@/features/digital-ordering/menu/admin/MenuConfigurator";
import { useDigitalOrderingSettings } from "@/features/digital-ordering/hooks/useDigitalOrderingSettings";
import { digitalStoreService } from "@/features/digital-ordering/services/digitalStore.service";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import {
  ContextualSetupBanner,
  useContextualSetup,
} from "@/features/operation-onboarding";

export default function DigitalOrderingSettingsPage() {
  const {
    organizationId,
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

  // Draft holds unsaved edits so the preview updates without a round-trip.
  const [draft, setDraft] = useState<DigitalStoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!settings) {
      setDraft(null);
      return;
    }
    // Do not clobber in-progress edits if a late load/settings update arrives.
    if (dirtyRef.current) return;
    setDraft(settings);
  }, [settings]);

  const applyPatch = useCallback((patch: Partial<DigitalStoreSettings>) => {
    dirtyRef.current = true;
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const isDirty = useMemo(() => {
    if (!draft || !settings) return false;
    return JSON.stringify(draft) !== JSON.stringify(settings);
  }, [draft, settings]);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  const previewQrCodes = useMemo(() => {
    if (!draft) return qrCodes;
    return digitalStoreService.buildQrCodes(draft, tables);
  }, [draft, tables, qrCodes]);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const persisted = await saveSettings(draft);
      dirtyRef.current = false;
      setDraft(persisted);
      toast.success("Configurações salvas.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao salvar configurações."
      );
    } finally {
      setSaving(false);
    }
  }, [draft, saveSettings]);

  if (!settings || !draft) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handlePublish = async () => {
    try {
      // Persist slug/settings first so publish targets the same public identity.
      if (isDirty && draft) {
        const persistedSettings = await saveSettings(draft);
        dirtyRef.current = false;
        setDraft(persistedSettings);
      }
      const products = await publishCatalog();
      if (products.length === 0) {
        throw new Error("Nenhum produto foi publicado.");
      }
      dirtyRef.current = false;
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
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs font-medium text-amber-600">
                Alterações não salvas
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved && !isDirty ? "Salvo!" : "Salvar"}
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Cardápio digital
          </h2>
          <p className="text-sm text-slate-500">
            Escolha o nicho e personalize a aparência. O preview mostra
            exatamente o que o cliente verá.
          </p>
        </div>

        <MenuConfigurator
          organizationId={organizationId}
          settings={draft}
          onChange={applyPatch}
        />
      </section>

      <div
        ref={formRef}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Operação</h2>
          <p className="text-sm text-slate-500">
            Endereço da loja, modos de atendimento, valores e mesas.
          </p>
        </div>

        <DigitalStoreSettingsForm
          settings={draft}
          tables={tables}
          onChange={applyPatch}
          onTablesChange={saveTables}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">QR Codes</h2>
          <p className="text-sm text-slate-500">
            Cardápio, mesa, retirada, delivery e evento — gerados
            automaticamente por loja.
          </p>
        </div>
        <DigitalQrCodePanel
          qrCodes={previewQrCodes}
          storeName={draft.organizationName}
        />
      </section>
    </div>
  );
}
