import { useCallback, useEffect, useState } from "react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { digitalStoreService } from "../services/digitalStore.service";

export function useDigitalMenu(organizationId: string | null, storeSlug?: string | null) {
  const [products, setProducts] = useState<DigitalMenuProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const catalog = await digitalStoreService.loadMenuProducts(
        organizationId,
        storeSlug
      );
      setProducts(catalog.filter((product) => product.available));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar o cardápio."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, storeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, loading, error, reload: load };
}
