import { useEffect, useState } from "react";
import { getCompositionGroupCountsByProductIds } from "@/features/product-composition/repository/productOptionGroups.repository";
import { logger } from "@/lib/logger";
import type { Product } from "../types/product";

/**
 * Single batched fetch of composition link counts — avoids N+1 on the products page.
 */
export function useProductCompositionCounts(products: Product[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const idsKey = products.map((p) => p.id).join(",");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (products.length === 0) {
        setCounts({});
        return;
      }

      try {
        setLoading(true);
        const next = await getCompositionGroupCountsByProductIds(
          products.map((p) => p.id)
        );
        if (!cancelled) setCounts(next);
      } catch (error) {
        logger.error("Erro ao carregar contagem de composição", error);
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // idsKey captures product id set changes without deep compare
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { counts, loading };
}
