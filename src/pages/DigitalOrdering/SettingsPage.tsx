import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import DigitalQrCodePanel from "@/features/digital-ordering/components/DigitalQrCodePanel";
import DigitalStoreSettingsForm from "@/features/digital-ordering/components/DigitalStoreSettingsForm";
import MenuConfigurator from "@/features/digital-ordering/menu/admin/MenuConfigurator";
import { useDigitalOrderingSettings } from "@/features/digital-ordering/hooks/useDigitalOrderingSettings";
import { digitalStoreService } from "@/features/digital-ordering/services/digitalStore.service";
import { resolvePublishTargetSlug } from "@/features/digital-ordering/menu/admin/editor/publishDraft";
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Draft holds unsaved edits so the preview updates without a round-trip.
  const [draft, setDraft] = useState<DigitalStoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const dirtyRef = useRef(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

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
    setSaveError(null);
    try {
      const persisted = await saveSettings(draft);
      dirtyRef.current = false;
      setDraft(persisted);
      toast.success("Configurações salvas.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao salvar configurações.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [draft, saveSettings]);

  const handleDiscard = useCallback(() => {
    if (!settings) return;
    dirtyRef.current = false;
    setDraft(settings);
    toast.message("Alterações descartadas.");
  }, [settings]);

  if (!settings || !draft) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handlePublish = async () => {
    if (publishing || saving || !draft) return;
    setPublishError(null);
    setPublished(false);
    try {
      let savedSlug: string | undefined;
      if (isDirty) {
        const persistedSettings = await saveSettings(draft);
        dirtyRef.current = false;
        setDraft(persistedSettings);
        savedSlug = persistedSettings.slug;
      }
      const slug = resolvePublishTargetSlug(savedSlug, draft.slug);
      const products = await publishCatalog(slug);
      if (products.length === 0) {
        throw new Error("Nenhum produto foi publicado.");
      }
      dirtyRef.current = false;
      setPublished(true);
      window.setTimeout(() => setPublished(false), 2500);
      toast.success(`Cardápio publicado com ${products.length} produtos.`);
      await refreshAfterAction();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao publicar cardápio.";
      setPublishError(message);
      toast.error(message);
    }
  };

  const focusSetup = () => {
    menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      />

      <div ref={menuRef}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Configurações · Menu
        </p>
        <MenuConfigurator
          organizationId={organizationId}
          settings={draft}
          savedSettings={settings}
          onChange={applyPatch}
          isDirty={isDirty}
          saving={saving}
          publishing={publishing}
          saved={saved}
          published={published}
          saveError={saveError}
          publishError={publishError}
          offline={offline}
          onSave={() => void handleSave()}
          onPublish={() => void handlePublish()}
          onDiscard={handleDiscard}
        />
      </div>

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
        <DigitalQrCodePanel qrCodes={previewQrCodes} />
      </section>
    </div>
  );
}
