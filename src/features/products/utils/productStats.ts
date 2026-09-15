import type { Product } from "../types/product";

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  estimatedStockValue: number;
}

export function computeProductStats(products: Product[]): ProductStats {
  return products.reduce<ProductStats>(
    (stats, product) => {
      stats.total += 1;

      if (product.status === "active") {
        stats.active += 1;
      } else {
        stats.inactive += 1;
      }

      stats.estimatedStockValue += product.price * product.stock;

      return stats;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      estimatedStockValue: 0,
    }
  );
}
