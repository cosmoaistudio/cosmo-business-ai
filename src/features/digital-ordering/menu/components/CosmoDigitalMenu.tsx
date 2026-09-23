import { useEffect, useMemo, type RefObject } from "react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "../../types/digitalStore.types";
import DigitalMenuGrid from "../../components/DigitalMenuGrid";
import { applyMenuSeo, buildMenuSeo } from "../core/menuSeo";
import {
  listNavigableCategories,
  resolveCatalogNavigation,
} from "../core/menuCatalog";
import { hasCustomCatalogCopy } from "../core/storeMeta";
import { FEATURED_SECTION_ID } from "../core/menuSectionNav";
import { useMenuCatalog } from "../hooks/useMenuCatalog";
import { useMenuSectionNav } from "../hooks/useMenuSectionNav";
import { menuThemeStyle, radiusToCss } from "../theme/menuTheme";
import { getActiveMenuTemplate } from "../templates/resolveMenuTemplate";
import type { DigitalMenuNiche } from "../types/digitalMenu.types";
import MenuPreviewRegion from "../admin/editor/MenuPreviewRegion";
import MenuCategorySections from "./MenuCategorySections";
import MenuCategoryTabs from "./MenuCategoryTabs";
import MenuFeaturedSection from "./MenuFeaturedSection";
import MenuHighlights from "./MenuHighlights";
import MenuSearch from "./MenuSearch";

interface CosmoDigitalMenuProps {
  products: DigitalMenuProduct[];
  loading: boolean;
  store: DigitalStoreSettings | null;
  onSelectProduct: (productId: string) => void;
  niche?: DigitalMenuNiche | null;
  manageSeo?: boolean;
  error?: string | null;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export default function CosmoDigitalMenu({
  products,
  loading,
  store,
  onSelectProduct,
  niche,
  manageSeo = true,
  error = null,
  scrollContainerRef,
}: CosmoDigitalMenuProps) {
  const {
    config,
    theme,
    showProductImages,
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

  const navigation = resolveCatalogNavigation(config.features.catalogNavigation);
  const isSections = navigation === "sections";
  const showFeaturedSection = isSections && catalog.highlights.length > 0;
  const navigableCategories = listNavigableCategories(
    catalog.categories,
    navigation
  );
  const sectionNavCategories = showFeaturedSection
    ? [
        {
          id: FEATURED_SECTION_ID,
          label: config.copy.highlightsTitle,
          productCount: catalog.highlights.length,
        },
        ...navigableCategories,
      ]
    : navigableCategories;
  const sectionIds = useMemo(
    () =>
      showFeaturedSection
        ? [
            FEATURED_SECTION_ID,
            ...catalog.sections.map((section) => section.categoryId),
          ]
        : catalog.sections.map((section) => section.categoryId),
    [catalog.sections, showFeaturedSection]
  );

  const { rootRef, activeSectionId, scrollToSection } = useMenuSectionNav({
    enabled: isSections && !loading,
    sectionIds,
    scrollContainerRef,
  });

  const template = useMemo(
    () =>
      getActiveMenuTemplate({
        menuTemplateId: store?.menuTemplateId,
        niche: niche ?? store?.niche,
      }),
    [store?.menuTemplateId, niche, store?.niche]
  );

  const seo = useMemo(() => buildMenuSeo(store, config), [store, config]);

  useEffect(() => {
    if (!manageSeo) return;
    applyMenuSeo(seo);
  }, [manageSeo, seo]);

  const emptyMessage = error
    ? error
    : catalog.isFiltered
      ? config.copy.emptySearchMessage
      : config.copy.emptyMenuMessage;

  const showImages = showProductImages;

  const showDesktopAside =
    !isSections &&
    config.features.showCategoryTabs &&
    catalog.categories.length > 2;

  const showTabs =
    config.features.showCategoryTabs &&
    (isSections ? sectionNavCategories.length > 0 : catalog.categories.length > 2);

  const gridProps = {
    theme,
    emptyMessage,
    showDescriptions: config.features.showDescriptions,
    showImages,
    showPopularBadge: config.features.showPopularBadge,
    showPromotions: config.features.showPromotions,
    cardEmphasis: template.capabilities.cardEmphasis,
    addLabel: config.copy.addToCartLabel,
    customizableLabel: config.copy.customizableLabel,
    onSelectProduct,
  };

  return (
    <div
      ref={rootRef}
      data-catalog-navigation={navigation}
      className={
        showDesktopAside
          ? "flex flex-col gap-5 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8"
          : "flex flex-col gap-3"
      }
      style={{
        ...menuThemeStyle(theme),
        fontFamily: theme.fontFamily,
        ["--menu-section-offset" as string]: "7.5rem",
      }}
    >
      {showDesktopAside ? (
        <aside className="hidden lg:block" data-menu-category-aside="">
          <MenuPreviewRegion id="categories">
          <div
            className="sticky top-24 space-y-1 border p-3"
            style={{
              backgroundColor: theme.surfaceColor,
              borderColor: theme.borderColor,
              borderRadius: radiusToCss(theme.cardRadius),
            }}
          >
            <p
              className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: theme.mutedTextColor }}
            >
              Categorias
            </p>
            <ul className="space-y-1">
              {catalog.categories.map((category) => {
                const active = category.id === activeCategoryId;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => setCategoryId(category.id)}
                      aria-current={active ? "true" : undefined}
                      className="digital-focus-ring digital-motion-press flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold"
                      style={{
                        borderRadius: radiusToCss(theme.buttonRadius),
                        backgroundColor: active
                          ? theme.primaryColor
                          : "transparent",
                        color: active ? "#ffffff" : theme.textColor,
                      }}
                    >
                      <span className="truncate">{category.label}</span>
                      <span
                        className="text-[11px] opacity-75"
                        style={{
                          color: active ? "#ffffff" : theme.mutedTextColor,
                        }}
                      >
                        {category.productCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          </MenuPreviewRegion>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3">
        {hasCustomCatalogCopy(store) &&
        (config.copy.catalogTitle || config.copy.catalogSubtitle) ? (
          <div className="space-y-0.5" data-catalog-copy="custom">
            {config.copy.catalogTitle ? (
              <h2
                className="text-sm font-semibold tracking-tight sm:text-base"
                style={{
                  color: theme.textColor,
                  fontFamily: theme.headingFontFamily,
                }}
              >
                {config.copy.catalogTitle}
              </h2>
            ) : null}
            {config.copy.catalogSubtitle ? (
              <p className="text-xs" style={{ color: theme.mutedTextColor }}>
                {config.copy.catalogSubtitle}
              </p>
            ) : null}
          </div>
        ) : null}

        {isSections && showTabs ? (
          <div className="contents">
            <MenuPreviewRegion id="categories">
              <MenuCategoryTabs
                categories={sectionNavCategories}
                activeCategoryId={activeSectionId}
                theme={theme}
                navigation={navigation}
                alwaysVisible
                onSelect={scrollToSection}
              />
            </MenuPreviewRegion>
          </div>
        ) : null}

        {config.features.showSearch && catalog.totalAvailable > 0 && (
          <MenuPreviewRegion id="search">
            <MenuSearch
              value={search}
              placeholder={config.copy.searchPlaceholder}
              theme={theme}
              onChange={setSearch}
            />
          </MenuPreviewRegion>
        )}

        {!isSections && showTabs ? (
          <div className="contents lg:hidden">
            <MenuPreviewRegion id="categories">
              <MenuCategoryTabs
                categories={catalog.categories}
                activeCategoryId={activeCategoryId}
                theme={theme}
                navigation={navigation}
                onSelect={setCategoryId}
              />
            </MenuPreviewRegion>
          </div>
        ) : null}

        {showFeaturedSection ? (
          <MenuPreviewRegion id="highlights">
            <MenuFeaturedSection
              products={catalog.highlights}
              title={config.copy.highlightsTitle}
              {...gridProps}
            />
          </MenuPreviewRegion>
        ) : null}

        {!isSections && catalog.highlights.length > 0 ? (
          <MenuPreviewRegion id="highlights">
            <MenuHighlights
              products={catalog.highlights}
              theme={theme}
              copy={config.copy}
              showImages={showImages}
              onSelectProduct={onSelectProduct}
            />
          </MenuPreviewRegion>
        ) : null}

        <MenuPreviewRegion id="catalog">
        {isSections ? (
          <MenuCategorySections
            sections={catalog.sections}
            loading={loading}
            {...gridProps}
          />
        ) : (
          <DigitalMenuGrid
            products={catalog.products}
            loading={loading}
            {...gridProps}
          />
        )}
        </MenuPreviewRegion>
      </div>
    </div>
  );
}
