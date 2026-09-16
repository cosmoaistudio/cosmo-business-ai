export * from "./types/digitalMenu.types";

export {
  DEFAULT_DIGITAL_MENU_NICHE,
  appearanceFromNiche,
  getNicheConfig,
  isDigitalMenuNiche,
  listNiches,
  resolveNiche,
} from "./config/nicheConfig";

export {
  ALL_CATEGORY_ID,
  UNCATEGORIZED_ID,
  UNCATEGORIZED_LABEL,
  buildMenuCatalog,
  buildMenuCategories,
  buildMenuHighlights,
  categoryIdFromLabel,
  filterMenuProducts,
  hasActivePromotion,
  listAvailableProducts,
  normalizeSearchTerm,
  resolveProductPrice,
} from "./core/menuCatalog";

export { applyMenuSeo, buildMenuSeo } from "./core/menuSeo";

export {
  acceptsMode,
  describePrepTime,
  resolveStoreStatus,
  type MenuStoreAvailability,
  type MenuStoreStatus,
  type MenuStoreTone,
} from "./core/storeStatus";

export {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  menuThemeStyle,
  menuThemeToCssVars,
  parseMenuThemeOverrides,
  radiusToClass,
  radiusToCss,
  resolveMenuTheme,
} from "./theme/menuTheme";

export { useMenuCatalog } from "./hooks/useMenuCatalog";
export { useMenuTheme } from "./hooks/useMenuTheme";

export { default as CosmoDigitalMenu } from "./components/CosmoDigitalMenu";
export { default as MenuSearch } from "./components/MenuSearch";
export { default as MenuCategoryTabs } from "./components/MenuCategoryTabs";
export { default as MenuHighlights } from "./components/MenuHighlights";
export { default as MenuBanner } from "./components/MenuBanner";
export { default as MenuCartBar } from "./components/MenuCartBar";
export { default as MenuStoreStatusBadge } from "./components/MenuStoreStatus";

export { default as MenuConfigurator } from "./admin/MenuConfigurator";
export { default as MenuNicheSelector } from "./admin/MenuNicheSelector";
export { default as MenuThemeEditor } from "./admin/MenuThemeEditor";
export { default as MenuMobilePreview } from "./admin/MenuMobilePreview";
