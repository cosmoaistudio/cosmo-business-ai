import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const publishingLockRef = useRef(false);
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
        // Load only — never re-upsert on mount. Re-saving here raced with user
        // edits and could overwrite persisted niche/theme with a stale snapshot.
        const loaded = await digitalStoreService.loadSettings(
          organizationId,
          organizationName
        );
        const loadedTables = await digitalStoreService.loadTables(organizationId);
        const payment = await digitalStoreService.loadPaymentSettings(organizationId);

        if (cancelled) return;

        setSettings(loaded);
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
      if (!organizationId || !settings || !paymentSettings) {
        throw new Error(
          "Configurações ainda não estão prontas para salvar. Aguarde o carregamento."
        );
      }

      const merged: DigitalStoreSettings = {
        ...settings,
        ...next,
        slug: normalizeStoreSlug(next.slug ?? settings.slug),
        // Nested objects must come from `next` when provided — avoid keeping
        // stale theme/menuTheme from the previous settings snapshot.
        theme: next.theme ?? settings.theme,
        menuTheme: next.menuTheme ?? settings.menuTheme,
      };

      const persisted = await digitalStoreService.saveSettings(
        merged,
        paymentSettings,
        digitalStoreService.buildQrCodes(merged, tables)
      );
      setSettings(persisted);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
      return persisted;
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

  const publishCatalog = useCallback(async (expectedSlug?: string) => {
    if (!organizationId || !settings || !paymentSettings) {
      throw new Error(
        "Configurações ainda não estão prontas para publicar. Aguarde o carregamento."
      );
    }
    if (publishingLockRef.current) {
      throw new Error("Publicação já em andamento.");
    }

    const slug = expectedSlug ?? settings.slug;

    publishingLockRef.current = true;
    setPublishing(true);
    try {
      // Persist onto the store that matches the slug just saved.
      const persisted = await digitalStoreService.publishCatalog(
        organizationId,
        slug
      );
      setSettings((current) =>
        current
          ? {
              ...current,
              slug: persisted.slug,
              publishedAt: persisted.publishedAt,
            }
          : current
      );
      return persisted.products;
    } finally {
      publishingLockRef.current = false;
      setPublishing(false);
    }
  }, [organizationId, settings, paymentSettings]);

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
