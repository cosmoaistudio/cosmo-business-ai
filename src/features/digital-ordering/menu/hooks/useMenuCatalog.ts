import { useMemo, useState } from "react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import { ALL_CATEGORY_ID, buildMenuCatalog } from "../core/menuCatalog";
import type {
  DigitalMenuNiche,
  MenuThemeOverrides,
} from "../types/digitalMenu.types";
import { useMenuTheme } from "./useMenuTheme";

interface UseMenuCatalogParams {
  products: DigitalMenuProduct[];
  store: DigitalStoreSettings | null;
  niche?: DigitalMenuNiche | null;
  themeOverrides?: MenuThemeOverrides;
}

/**
 * Derives the whole menu view state from the products already loaded by
 * useDigitalMenu. No extra network calls.
 */
export function useMenuCatalog({
  products,
  store,
  niche,
  themeOverrides,
}: UseMenuCatalogParams) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState(ALL_CATEGORY_ID);

  const { config, theme, copy, features, showProductImages } = useMenuTheme(
    store,
    niche,
    themeOverrides
  );

  const catalog = useMemo(
    () =>
      buildMenuCatalog(
        products,
        { ...config, copy, features },
        { search, categoryId }
      ),
    [products, config, copy, features, search, categoryId]
  );

  // A category can disappear when the catalog reloads.
  const activeCategoryId = useMemo(() => {
    if (categoryId === ALL_CATEGORY_ID) return ALL_CATEGORY_ID;
    const exists = catalog.categories.some((entry) => entry.id === categoryId);
    return exists ? categoryId : ALL_CATEGORY_ID;
  }, [catalog.categories, categoryId]);

  return {
    config: { ...config, copy, features },
    theme,
    showProductImages,
    catalog,
    search,
    activeCategoryId,
    setSearch,
    setCategoryId,
    resetFilters: () => {
      setSearch("");
      setCategoryId(ALL_CATEGORY_ID);
    },
  };
}
