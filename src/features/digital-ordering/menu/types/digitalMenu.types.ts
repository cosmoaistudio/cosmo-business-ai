import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

/**
 * Cosmo Digital Menu — niches supported by the same engine.
 * Adding a niche means adding an entry here plus one record in NICHE_CONFIGS.
 */
export type DigitalMenuNiche =
  | "generic"
  | "acai"
  | "hamburgueria"
  | "pizzaria"
  | "adega"
  | "restaurante"
  | "doceria";

export type MenuRadius = "none" | "sm" | "md" | "lg" | "xl";
export type MenuButtonStyle = "solid" | "soft" | "outline";
export type MenuProductLayout = "grid" | "list";
export type MenuBannerStyle = "image" | "gradient" | "minimal";
export type MenuDensity = "comfortable" | "compact";

/**
 * Serializable theme tokens. Persisted inside the existing `digital_stores.theme`
 * jsonb column, so extending this shape needs no migration.
 */
export interface MenuTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  fontFamily: string;
  headingFontFamily: string;
  cardRadius: MenuRadius;
  buttonRadius: MenuRadius;
  buttonStyle: MenuButtonStyle;
  productLayout: MenuProductLayout;
  bannerStyle: MenuBannerStyle;
  density: MenuDensity;
  showProductImages: boolean;
}

export type MenuThemeOverrides = Partial<MenuTheme>;

/** Copy that changes per niche without forking components. */
export interface NicheCopy {
  searchPlaceholder: string;
  allCategoryLabel: string;
  highlightsTitle: string;
  emptyMenuMessage: string;
  emptySearchMessage: string;
  addToCartLabel: string;
  viewCartLabel: string;
  customizableLabel: string;
}

/** Feature switches so one component tree serves every niche. */
export interface NicheFeatures {
  showSearch: boolean;
  showCategoryTabs: boolean;
  showHighlights: boolean;
  showDescriptions: boolean;
  showProductImages: boolean;
}

/** Reserved for niche-specific behaviour introduced in later phases. */
export interface NicheRules {
  /** Highlights fall back to products with an active promotion. */
  highlightPromotions: boolean;
  maxHighlights: number;
}

export interface NicheConfig {
  niche: DigitalMenuNiche;
  label: string;
  /** Preferred category ordering. Categories absent from the data are skipped. */
  defaultCategories: string[];
  copy: NicheCopy;
  features: NicheFeatures;
  rules: NicheRules;
  theme: MenuThemeOverrides;
}

export interface MenuCategory {
  id: string;
  label: string;
  productCount: number;
}

/** Resolved price for a product, accounting for an optional promotion. */
export interface MenuProductPrice {
  basePrice: number;
  promotionalPrice: number | null;
  effectivePrice: number;
  hasPromotion: boolean;
  discountPercent: number;
}

export interface MenuCatalogState {
  search: string;
  categoryId: string;
}

export interface MenuCatalog {
  categories: MenuCategory[];
  products: DigitalMenuProduct[];
  highlights: DigitalMenuProduct[];
  totalAvailable: number;
  isFiltered: boolean;
  isEmpty: boolean;
}

export interface MenuSeo {
  title: string;
  description: string;
  imageUrl: string | null;
  url: string | null;
}
