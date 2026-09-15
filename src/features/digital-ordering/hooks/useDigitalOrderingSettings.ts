import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import type {
  DigitalQrCodeEntry,
  DigitalStoreSettings,
  DigitalStoreTable,
} from "../types/digitalStore.types";
import type { DigitalPaymentSettings } from "../types/digitalPayment.types";
import { digitalStoreService } from "../services/digitalStore.service";
import { normalizeStoreSlug } from "../utils/storeSlug";

export function useDigitalOrderingSettings() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? null;
  const organizationName =
    profile?.organizations?.name ?? profile?.full_name ?? "Minha Loja";

  const [settings, setSettings] = useState<DigitalStoreSettings | null>(null);
  const [tables, setTables] = useState<DigitalStoreTable[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<DigitalPaymentSettings | null>(
    null
  );
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const loaded = await digitalStoreService.loadSettings(organizationId, organizationName);
        const loadedTables = await digitalStoreService.loadTables(organizationId);
        const payment = await digitalStoreService.loadPaymentSettings(organizationId);

        if (cancelled) return;

        const persisted = await digitalStoreService.saveSettings(loaded, payment);
        setSettings(persisted);
        setTables(loadedTables);
        setPaymentSettings(payment);
      } catch (error) {
        console.error("Erro ao carregar pedido digital:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, organizationName]);

  const qrCodes = useMemo<DigitalQrCodeEntry[]>(() => {
    if (!settings) return [];
    return digitalStoreService.buildQrCodes(settings, tables);
  }, [settings, tables]);

  const saveSettings = useCallback(
    async (next: Partial<DigitalStoreSettings>) => {
      if (!organizationId || !settings || !paymentSettings) return;

      const merged: DigitalStoreSettings = {
        ...settings,
        ...next,
        slug: normalizeStoreSlug(next.slug ?? settings.slug),
      };

      const persisted = await digitalStoreService.saveSettings(
        merged,
        paymentSettings,
        digitalStoreService.buildQrCodes(merged, tables)
      );
      setSettings(persisted);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
    [organizationId, settings, paymentSettings, tables]
  );

  const saveTables = useCallback(
    async (next: DigitalStoreTable[]) => {
      if (!organizationId || !settings || !paymentSettings) return;

      const saved = await digitalStoreService.saveTables(organizationId, next);
      await digitalStoreService.saveSettings(
        settings,
        paymentSettings,
        digitalStoreService.buildQrCodes(settings, saved)
      );
      setTables(saved);
    },
    [organizationId, settings, paymentSettings]
  );

  const savePaymentSettings = useCallback(
    async (next: DigitalPaymentSettings) => {
      if (!organizationId || !settings) return;

      setPaymentSettings(next);
      await digitalStoreService.saveSettings(
        settings,
        next,
        digitalStoreService.buildQrCodes(settings, tables)
      );
    },
    [organizationId, settings, tables]
  );

  const publishCatalog = useCallback(async () => {
    if (!organizationId || !settings || !paymentSettings) return [];

    setPublishing(true);
    try {
      const products = await digitalStoreService.publishCatalog(organizationId);
      await saveSettings({ publishedAt: new Date().toISOString() });
      return products;
    } finally {
      setPublishing(false);
    }
  }, [organizationId, settings, paymentSettings, saveSettings]);

  return {
    organizationId,
    settings,
    tables,
    paymentSettings,
    qrCodes,
    publishing,
    saved,
    loading,
    saveSettings,
    saveTables,
    savePaymentSettings,
    publishCatalog,
  };
}
