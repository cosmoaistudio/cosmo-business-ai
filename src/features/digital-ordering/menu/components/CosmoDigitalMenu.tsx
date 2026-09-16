import { useEffect, useMemo } from "react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import DigitalMenuGrid from "../../components/DigitalMenuGrid";
import { applyMenuSeo, buildMenuSeo } from "../core/menuSeo";
import { useMenuCatalog } from "../hooks/useMenuCatalog";
import { menuThemeStyle } from "../theme/menuTheme";
import type { DigitalMenuNiche } from "../types/digitalMenu.types";
import MenuCategoryTabs from "./MenuCategoryTabs";
import MenuHighlights from "./MenuHighlights";
import MenuSearch from "./MenuSearch";

interface CosmoDigitalMenuProps {
  products: DigitalMenuProduct[];
  loading: boolean;
  store: DigitalStoreSettings | null;
  onSelectProduct: (productId: string) => void;
  /** Overrides the store niche — useful for previews. */
  niche?: DigitalMenuNiche | null;
  /** Disable when the menu is embedded somewhere that owns the document head. */
  manageSeo?: boolean;
}

/**
 * Cosmo Digital Menu — mobile-first public menu engine.
 * Composes search, categories and highlights over the existing product grid,
 * cart and checkout. One component tree serves every niche.
 */
export default function CosmoDigitalMenu({
  products,
  loading,
  store,
  onSelectProduct,
  niche,
  manageSeo = true,
}: CosmoDigitalMenuProps) {
  const {
    config,
    theme,
    catalog,
    search,
    activeCategoryId,
    setSearch,
    setCategoryId,
  } = useMenuCatalog({
    products,
    store,
    niche,
    themeOverrides: store?.menuTheme,
  });

  const seo = useMemo(() => buildMenuSeo(store, config), [store, config]);

  useEffect(() => {
    if (!manageSeo) return;
    applyMenuSeo(seo);
  }, [manageSeo, seo]);

  const emptyMessage = catalog.isFiltered
    ? config.copy.emptySearchMessage
    : config.copy.emptyMenuMessage;

  return (
    <div
      className="flex flex-col gap-5"
      style={{ ...menuThemeStyle(theme), fontFamily: theme.fontFamily }}
    >
      {config.features.showSearch && catalog.totalAvailable > 0 && (
        <MenuSearch
          value={search}
          placeholder={config.copy.searchPlaceholder}
          theme={theme}
          onChange={setSearch}
        />
      )}

      {config.features.showCategoryTabs && (
        <MenuCategoryTabs
          categories={catalog.categories}
          activeCategoryId={activeCategoryId}
          theme={theme}
          onSelect={setCategoryId}
        />
      )}

      <MenuHighlights
        products={catalog.highlights}
        theme={theme}
        copy={config.copy}
        onSelectProduct={onSelectProduct}
      />

      <DigitalMenuGrid
        products={catalog.products}
        loading={loading}
        theme={theme}
        emptyMessage={emptyMessage}
        showDescriptions={config.features.showDescriptions}
        addLabel={config.copy.addToCartLabel}
        customizableLabel={config.copy.customizableLabel}
        onSelectProduct={onSelectProduct}
      />
    </div>
  );
}
