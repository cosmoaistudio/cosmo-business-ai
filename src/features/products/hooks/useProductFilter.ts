import { useMemo, useState } from "react";
import type { Product } from "../types/product";
import { filterProductsByQuery } from "../utils/filterProducts";
import {
  resolveProductMenuKind,
  type ProductMenuFilter,
} from "../utils/productMenuKind";

export function useProductFilter(
  products: Product[],
  compositionCounts: Record<string, number> = {}
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<ProductMenuFilter>("all");

  const filteredProducts = useMemo(() => {
    const byQuery = filterProductsByQuery(products, searchQuery);

    if (kindFilter === "all") return byQuery;

    return byQuery.filter((product) => {
      const kind = resolveProductMenuKind({
        status: product.status,
        compositionGroupCount: compositionCounts[product.id] ?? 0,
        menuKind: product.menu_kind,
      });

      if (kindFilter === "paused") return kind === "paused";
      if (kindFilter === "simple") return kind === "simple";
      if (kindFilter === "assembled") return kind === "assembled";
      if (kindFilter === "combo") return kind === "combo";
      return true;
    });
  }, [products, searchQuery, kindFilter, compositionCounts]);

  return {
    searchQuery,
    setSearchQuery,
    kindFilter,
    setKindFilter,
    filteredProducts,
  };
}
