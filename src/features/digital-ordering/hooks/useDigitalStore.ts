import { useCallback, useEffect, useState } from "react";
import type { DigitalStoreSettings } from "../types/digitalStore.types";
import { digitalStoreService } from "../services/digitalStore.service";
import { applyDigitalStoreTheme, clearDigitalStoreTheme } from "../utils/storeTheme";

export function useDigitalStore(slug: string | undefined) {
  const [store, setStore] = useState<DigitalStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) {
      setStore(null);
      setLoading(false);
      setError("Loja não informada.");
      return;
    }

    setLoading(true);

    try {
      const resolved = await digitalStoreService.resolveBySlug(slug);

      if (!resolved) {
        setStore(null);
        setError("Loja não encontrada. Publique o cardápio digital nas configurações.");
        return;
      }

      setStore(resolved);
      setError(null);
      applyDigitalStoreTheme(resolved.theme);
    } catch {
      setStore(null);
      setError("Não foi possível carregar a loja digital.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
    return () => clearDigitalStoreTheme();
  }, [load]);

  return { store, loading, error, reload: load };
}

export function useDigitalStoreFromQuery(search: string) {
  const params = new URLSearchParams(search);
  const slug = params.get("store") ?? undefined;
  return useDigitalStore(slug);
}
