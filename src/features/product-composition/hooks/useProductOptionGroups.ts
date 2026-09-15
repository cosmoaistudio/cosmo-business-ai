import { useCallback, useEffect, useState } from "react";
import { productCompositionService } from "../services/productComposition.service";
import type { ProductOptionGroupWithGroup } from "../types/productOptionGroup";

export function useProductOptionGroups(productId?: string) {
  const [groups, setGroups] = useState<ProductOptionGroupWithGroup[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));

  const reload = useCallback(async () => {
    if (!productId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data =
        await productCompositionService.getProductOptionGroups(productId);
      setGroups(data);
    } catch (error) {
      console.error("Erro ao buscar composição do produto:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    groups,
    loading,
    reload,
  };
}
