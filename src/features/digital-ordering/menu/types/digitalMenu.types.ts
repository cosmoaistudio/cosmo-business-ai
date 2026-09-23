import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

/**
 * Cosmo Digital Menu — niches supported by the same engine.
 * Adding a niche means adding an entry here plus one record in NICHE_DEFINITIONS.
 * Product/option composition stays generic (products + option_groups + options).
 */
export type DigitalMenuNiche =
  | "generic"
  | "acai"
  | "hamburgueria"
  | "pizzaria"
  | "sushi"
  | "adega"
  | "cafeteria"
  | "doceria"
  | "sorveteria"
  | "restaurante"
  | "lanchonete"
  | "pastelaria"
  | "marmitaria"
  | "barbearia"
  | "varejo"
  | "servicos";

export type MenuRadius = "none" | "sm" | "md" | "lg" | "xl";
export type MenuButtonStyle = "solid" | "soft" | "outline";
export type MenuProductLayout = "grid" | "list";
export type MenuBannerStyle = "image" | "gradient" | "minimal" | "hidden";
export type MenuDensity = "comfortable" | "compact" | "spacious";
export type MenuImageAspect = "square" | "portrait" | "landscape";
export type MenuShadowStyle = "none" | "soft" | "medium";
export type MenuFontSize = "sm" | "md" | "lg";
export type MenuFontWeight = "normal" | "medium" | "semibold" | "bold";
export type MenuHeadingScale = "sm" | "md" | "lg";
export type MenuContentWidth = "narrow" | "default" | "wide";
export type MenuCatalogColumns = 2 | 3 | 4;
export type MenuPricePosition = "below" | "inline" | "trailing" | "top" | "bottom";
export type MenuCtaPosition = "footer" | "inline" | "bottom" | "full";
export type MenuCardStyle = "elevated" | "flat" | "bordered";
export type MenuImageSize = "compact" | "medium" | "large";
export type MenuLogoSize = "sm" | "md" | "lg";
export type MenuHeaderAlign = "left" | "center";
export type MenuBannerHeight = "sm" | "md" | "lg";
export type MenuBannerOverlay = "none" | "soft" | "strong";
export type MenuButtonHeight = "sm" | "md" | "lg";
export type MenuCatalogNavigation = "filter" | "sections";

/**
 * Serializable theme tokens. Persisted inside the existing `digital_stores.theme`
 * jsonb / menuTheme overrides — extending this shape needs no migration.
 */
export interface MenuTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  /** Raised panels (cards, sticky chrome) — derived when omitted in overrides. */
  surfaceElevated: string;
  /** Subtle inset / muted blocks. */
  surfaceMuted: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: MenuFontSize;
  headingFontWeight: MenuFontWeight;
  bodyFontWeight: MenuFontWeight;
  headingScale: MenuHeadingScale;
  cardRadius: MenuRadius;
  buttonRadius: MenuRadius;
  buttonStyle: MenuButtonStyle;
  buttonHeight: MenuButtonHeight;
  buttonFontWeight: MenuFontWeight;
  buttonShadow: boolean;
  productLayout: MenuProductLayout;
  bannerStyle: MenuBannerStyle;
  bannerHeight: MenuBannerHeight;
  bannerOverlay: MenuBannerOverlay;
  bannerRadius: MenuRadius;
  density: MenuDensity;
  contentWidth: MenuContentWidth;
  catalogColumns: MenuCatalogColumns;
  pricePosition: MenuPricePosition;
  ctaPosition: MenuCtaPosition;
  cardStyle: MenuCardStyle;
  showProductImages: boolean;
  /** Product image crop — presentation only. */
  imageAspect: MenuImageAspect;
  imageSize: MenuImageSize;
  logoSize: MenuLogoSize;
  headerAlign: MenuHeaderAlign;
  shadowStyle: MenuShadowStyle;
}

export type MenuThemeOverrides = Partial<MenuTheme>;

/**
 * Copy that changes per template/niche without forking components.
 * Store overrides win; missing keys fall back through the template chain.
 */
export interface NicheCopy {
  searchPlaceholder: string;
  allCategoryLabel: string;
  highlightsTitle: string;
  emptyMenuMessage: string;
  emptySearchMessage: string;
  addToCartLabel: string;
  viewCartLabel: string;
  customizableLabel: string;
  catalogTitle: string;
  catalogSubtitle: string;
  cartTitle: string;
  checkoutLabel: string;
  deliveryLabel: string;
  pickupLabel: string;
  paymentTitle: string;
  orderSuccessTitle: string;
}

/** Feature switches so one component tree serves every niche/template. */
export interface NicheFeatures {
  showSearch: boolean;
  showCategoryTabs: boolean;
  showHighlights: boolean;
  showDescriptions: boolean;
  showProductImages: boolean;
  showPopularBadge: boolean;
  showPromotions: boolean;
  showOptionPreview: boolean;
  showComboSection: boolean;
  showDelivery: boolean;
  showPickup: boolean;
  /**
   * Catalog navigation presentation.
   * `filter` keeps today's category chip behavior.
   * `sections` keeps every category on the page and scrolls to it.
   */
  catalogNavigation: MenuCatalogNavigation;
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

/** One on-page category block used when catalogNavigation is `sections`. */
export interface MenuCatalogSection {
  categoryId: string;
  categoryName: string;
  products: DigitalMenuProduct[];
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
  /** Empty in `filter` mode. Same product objects as `products` — never copied. */
  sections: MenuCatalogSection[];
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
