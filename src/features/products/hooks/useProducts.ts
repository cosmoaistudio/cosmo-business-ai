import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import { productsService } from "../services/products.service";
import type { Product } from "../types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll();
      setProducts(data);
    } catch (error) {
      logger.error("Erro ao buscar produtos:", error);
      toast.error("Não foi possível carregar os produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    return onDataChanged(loadProducts);
  }, [loadProducts]);

  return {
    products,
    loading,
    reload: loadProducts,
  };
}