import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { isValidPromotionalPrice } from "@/features/products/utils/productDigitalPromo";
import type {
  MenuCatalog,
  MenuCatalogState,
  MenuCategory,
  MenuProductPrice,
  NicheConfig,
} from "../types/digitalMenu.types";

export const ALL_CATEGORY_ID = "__all__";
export const UNCATEGORIZED_ID = "__uncategorized__";
export const UNCATEGORIZED_LABEL = "Outros";

/** Accent- and case-insensitive so "acai" matches "Açaí". */
export function normalizeSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function categoryIdFromLabel(label: string): string {
  const normalized = normalizeSearchTerm(label);
  return normalized.length > 0 ? normalized : UNCATEGORIZED_ID;
}

function productCategoryLabel(product: DigitalMenuProduct): string {
  const raw = product.categoryName?.trim();
  return raw && raw.length > 0 ? raw : UNCATEGORIZED_LABEL;
}

export function resolveProductPrice(product: DigitalMenuProduct): MenuProductPrice {
  const basePrice = Number(product.basePrice) || 0;
  const rawPromotional =
    product.promotionalPrice == null ? null : Number(product.promotionalPrice);
  const promotionalPrice = isValidPromotionalPrice(basePrice, rawPromotional)
    ? rawPromotional
    : null;

  const effectivePrice = promotionalPrice ?? basePrice;
  const discountPercent =
    promotionalPrice != null && basePrice > 0
      ? Math.round(((basePrice - promotionalPrice) / basePrice) * 100)
      : 0;

  return {
    basePrice,
    promotionalPrice,
    effectivePrice,
    hasPromotion: promotionalPrice != null,
    discountPercent,
  };
}

export function hasActivePromotion(product: DigitalMenuProduct): boolean {
  return resolveProductPrice(product).hasPromotion;
}

export function listAvailableProducts(
  products: DigitalMenuProduct[]
): DigitalMenuProduct[] {
  return products.filter((product) => product.available !== false);
}

/**
 * Categories come from real product data. `defaultCategories` only influences
 * ordering — a niche category with no products never shows up.
 */
export function buildMenuCategories(
  products: DigitalMenuProduct[],
  config: NicheConfig
): MenuCategory[] {
  const available = listAvailableProducts(products);
  const byId = new Map<string, MenuCategory>();

  for (const product of available) {
    const label = productCategoryLabel(product);
    const id = categoryIdFromLabel(label);
    const existing = byId.get(id);

    if (existing) {
      existing.productCount += 1;
      continue;
    }

    byId.set(id, { id, label, productCount: 1 });
  }

  const preferredOrder = config.defaultCategories.map(categoryIdFromLabel);
  const categories = [...byId.values()].sort((a, b) => {
    // "Outros" always last, regardless of niche ordering.
    if (a.id === UNCATEGORIZED_ID) return 1;
    if (b.id === UNCATEGORIZED_ID) return -1;

    const aRank = preferredOrder.indexOf(a.id);
    const bRank = preferredOrder.indexOf(b.id);

    if (aRank !== -1 && bRank !== -1) return aRank - bRank;
    if (aRank !== -1) return -1;
    if (bRank !== -1) return 1;

    return a.label.localeCompare(b.label, "pt-BR");
  });

  if (categories.length === 0) return [];

  return [
    {
      id: ALL_CATEGORY_ID,
      label: config.copy.allCategoryLabel,
      productCount: available.length,
    },
    ...categories,
  ];
}

function matchesSearch(product: DigitalMenuProduct, term: string): boolean {
  if (term.length === 0) return true;

  const haystack = [
    product.name,
    product.description ?? "",
    product.categoryName ?? "",
  ]
    .map(normalizeSearchTerm)
    .join(" ");

  // Every word must match, so "acai morango" narrows instead of widening.
  return term.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterMenuProducts(
  products: DigitalMenuProduct[],
  state: MenuCatalogState
): DigitalMenuProduct[] {
  const term = normalizeSearchTerm(state.search);
  const categoryId = state.categoryId || ALL_CATEGORY_ID;

  return listAvailableProducts(products).filter((product) => {
    if (categoryId !== ALL_CATEGORY_ID) {
      const productCategoryId = categoryIdFromLabel(productCategoryLabel(product));
      if (productCategoryId !== categoryId) return false;
    }

    return matchesSearch(product, term);
  });
}

/**
 * Explicitly featured products first, then active promotions when the niche
 * allows it. Never invents highlights — returns empty when there is no signal.
 */
export function buildMenuHighlights(
  products: DigitalMenuProduct[],
  config: NicheConfig
): DigitalMenuProduct[] {
  if (!config.features.showHighlights) return [];

  const available = listAvailableProducts(products);
  const featured = available.filter((product) => product.featured === true);
  const promotional = config.rules.highlightPromotions
    ? available.filter(
        (product) => product.featured !== true && hasActivePromotion(product)
      )
    : [];

  return [...featured, ...promotional].slice(
    0,
    Math.max(0, config.rules.maxHighlights)
  );
}

export function buildMenuCatalog(
  products: DigitalMenuProduct[],
  config: NicheConfig,
  state: MenuCatalogState
): MenuCatalog {
  const available = listAvailableProducts(products);
  const filtered = filterMenuProducts(products, state);
  const isFiltered =
    normalizeSearchTerm(state.search).length > 0 ||
    (state.categoryId !== ALL_CATEGORY_ID && state.categoryId !== "");

  return {
    categories: config.features.showCategoryTabs
      ? buildMenuCategories(products, config)
      : [],
    products: filtered,
    highlights: isFiltered ? [] : buildMenuHighlights(products, config),
    totalAvailable: available.length,
    isFiltered,
    isEmpty: filtered.length === 0,
  };
}
