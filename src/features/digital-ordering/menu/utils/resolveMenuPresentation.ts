import type {
  MenuCatalogNavigation,
  NicheConfig,
  NicheCopy,
  NicheFeatures,
} from "../types/digitalMenu.types";

const COPY_KEYS: Array<keyof NicheCopy> = [
  "searchPlaceholder",
  "allCategoryLabel",
  "highlightsTitle",
  "emptyMenuMessage",
  "emptySearchMessage",
  "addToCartLabel",
  "viewCartLabel",
  "customizableLabel",
  "catalogTitle",
  "catalogSubtitle",
  "cartTitle",
  "checkoutLabel",
  "deliveryLabel",
  "pickupLabel",
  "paymentTitle",
  "orderSuccessTitle",
];

const BOOLEAN_FEATURE_KEYS: Array<
  Exclude<keyof NicheFeatures, "catalogNavigation">
> = [
  "showSearch",
  "showCategoryTabs",
  "showHighlights",
  "showDescriptions",
  "showProductImages",
  "showPopularBadge",
  "showPromotions",
  "showOptionPreview",
  "showComboSection",
  "showDelivery",
  "showPickup",
];

export function sanitizeCatalogNavigation(
  value: unknown
): MenuCatalogNavigation | undefined {
  return value === "filter" || value === "sections" ? value : undefined;
}

/** Keep only non-empty string overrides — never store blanks that wipe niche defaults. */
export function sanitizeMenuCopyOverrides(
  raw: Partial<NicheCopy> | null | undefined
): Partial<NicheCopy> {
  if (!raw || typeof raw !== "object") return {};

  const result: Partial<NicheCopy> = {};
  for (const key of COPY_KEYS) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length > 0) {
      result[key] = value.trim();
    }
  }
  return result;
}

export function sanitizeMenuFeatureOverrides(
  raw: Partial<NicheFeatures> | null | undefined
): Partial<NicheFeatures> {
  if (!raw || typeof raw !== "object") return {};

  const result: Partial<NicheFeatures> = {};
  for (const key of BOOLEAN_FEATURE_KEYS) {
    const value = raw[key];
    if (typeof value === "boolean") {
      result[key] = value;
    }
  }

  const catalogNavigation = sanitizeCatalogNavigation(raw.catalogNavigation);
  if (catalogNavigation) {
    result.catalogNavigation = catalogNavigation;
  }

  return result;
}

/**
 * Precedence: template/niche defaults + store overrides.
 * Custom store values win; missing keys keep the template default.
 */
export function resolveMenuCopy(
  config: NicheConfig,
  storeCopy?: Partial<NicheCopy> | null
): NicheCopy {
  return {
    ...config.copy,
    ...sanitizeMenuCopyOverrides(storeCopy),
  };
}

export function resolveMenuFeatures(
  config: NicheConfig,
  storeFeatures?: Partial<NicheFeatures> | null
): NicheFeatures {
  return {
    ...config.features,
    ...sanitizeMenuFeatureOverrides(storeFeatures),
  };
}

function explicitBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Effective product-image visibility.
 *
 * Capability = template/niche `NicheFeatures.showProductImages` (structural).
 * Preference = explicit STORE/OVERRIDE (`menuTheme`, then legacy `menuFeatures`).
 * Missing preference inherits DEFAULT → TEMPLATE and is never coerced to false.
 *
 * A store cannot enable images when the template/niche forbids them.
 */
export function resolveShowProductImages(input: {
  capability: boolean;
  themeDefault?: boolean;
  storeTheme?: unknown;
  storeFeature?: unknown;
}): boolean {
  if (!input.capability) return false;

  const storeTheme = explicitBoolean(input.storeTheme);
  if (storeTheme !== undefined) return storeTheme;

  const storeFeature = explicitBoolean(input.storeFeature);
  if (storeFeature !== undefined) return storeFeature;

  return input.themeDefault ?? true;
}

export function resolveEffectiveProductImages(
  config: Pick<NicheConfig, "features" | "theme">,
  storeTheme?: { showProductImages?: unknown } | null,
  storeFeatures?: { showProductImages?: unknown } | null
): { allowed: boolean; enabled: boolean } {
  const allowed = config.features.showProductImages;
  return {
    allowed,
    enabled: resolveShowProductImages({
      capability: allowed,
      themeDefault: explicitBoolean(config.theme.showProductImages) ?? true,
      storeTheme: storeTheme?.showProductImages,
      storeFeature: storeFeatures?.showProductImages,
    }),
  };
}
