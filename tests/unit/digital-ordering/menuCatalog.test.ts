import { describe, expect, it } from "vitest";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import {
  ALL_CATEGORY_ID,
  UNCATEGORIZED_LABEL,
  buildMenuCatalog,
  buildMenuCategories,
  buildMenuHighlights,
  categoryIdFromLabel,
  filterMenuProducts,
  hasActivePromotion,
  normalizeSearchTerm,
  resolveProductPrice,
} from "@/features/digital-ordering/menu/core/menuCatalog";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";

function product(overrides: Partial<DigitalMenuProduct> = {}): DigitalMenuProduct {
  return {
    id: "p-1",
    name: "Açaí 500ml",
    basePrice: 20,
    available: true,
    menuKind: "simple",
    imageUrl: null,
    categoryName: "Açaí",
    description: null,
    promotionalPrice: null,
    featured: false,
    groups: [],
    ...overrides,
  };
}

const GENERIC = getNicheConfig("generic");
const ACAI = getNicheConfig("acai");

describe("normalizeSearchTerm", () => {
  it("strips accents, case and surrounding spaces", () => {
    expect(normalizeSearchTerm("  AÇAÍ  ")).toBe("acai");
    expect(normalizeSearchTerm("Pão de Queijo")).toBe("pao de queijo");
  });
});

describe("resolveProductPrice", () => {
  it("uses base price when there is no promotion", () => {
    const price = resolveProductPrice(product({ basePrice: 25 }));

    expect(price.effectivePrice).toBe(25);
    expect(price.hasPromotion).toBe(false);
    expect(price.promotionalPrice).toBeNull();
    expect(price.discountPercent).toBe(0);
  });

  it("applies a valid promotional price and computes the discount", () => {
    const price = resolveProductPrice(
      product({ basePrice: 20, promotionalPrice: 15 })
    );

    expect(price.effectivePrice).toBe(15);
    expect(price.hasPromotion).toBe(true);
    expect(price.discountPercent).toBe(25);
  });

  it("ignores promotions that are not cheaper than the base price", () => {
    expect(
      resolveProductPrice(product({ basePrice: 20, promotionalPrice: 20 }))
        .hasPromotion
    ).toBe(false);
    expect(
      resolveProductPrice(product({ basePrice: 20, promotionalPrice: 30 }))
        .hasPromotion
    ).toBe(false);
  });

  it("ignores zero, negative and missing promotional values", () => {
    expect(hasActivePromotion(product({ promotionalPrice: 0 }))).toBe(false);
    expect(hasActivePromotion(product({ promotionalPrice: -5 }))).toBe(false);
    expect(hasActivePromotion(product({ promotionalPrice: undefined }))).toBe(false);
  });
});

describe("buildMenuCategories", () => {
  it("derives categories from real product data with counts", () => {
    const categories = buildMenuCategories(
      [
        product({ id: "a", categoryName: "Açaí" }),
        product({ id: "b", categoryName: "Açaí" }),
        product({ id: "c", categoryName: "Bebidas" }),
      ],
      GENERIC
    );

    expect(categories[0].id).toBe(ALL_CATEGORY_ID);
    expect(categories[0].productCount).toBe(3);

    const acai = categories.find((entry) => entry.label === "Açaí");
    expect(acai?.productCount).toBe(2);
  });

  it("returns no categories when there are no available products", () => {
    expect(buildMenuCategories([], GENERIC)).toEqual([]);
    expect(
      buildMenuCategories([product({ available: false })], GENERIC)
    ).toEqual([]);
  });

  it("groups products without a category under Outros and keeps it last", () => {
    const categories = buildMenuCategories(
      [
        product({ id: "a", categoryName: null }),
        product({ id: "b", categoryName: "  " }),
        product({ id: "c", categoryName: "Bebidas" }),
      ],
      GENERIC
    );

    expect(categories.at(-1)?.label).toBe(UNCATEGORIZED_LABEL);
    expect(categories.at(-1)?.productCount).toBe(2);
  });

  it("orders categories using the niche preference first", () => {
    const categories = buildMenuCategories(
      [
        product({ id: "a", categoryName: "Bebidas" }),
        product({ id: "b", categoryName: "Açaí" }),
      ],
      ACAI
    );

    // Açaí precedes Bebidas in the acai niche ordering.
    expect(categories.slice(1).map((entry) => entry.label)).toEqual([
      "Açaí",
      "Bebidas",
    ]);
  });

  it("never invents niche categories that have no products", () => {
    const categories = buildMenuCategories(
      [product({ id: "a", categoryName: "Açaí" })],
      ACAI
    );

    expect(categories.map((entry) => entry.label)).not.toContain("Sorvetes");
  });
});

describe("filterMenuProducts", () => {
  const catalog = [
    product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí" }),
    product({
      id: "b",
      name: "Copo de morango",
      categoryName: "Bebidas",
      description: "Com leite condensado",
    }),
    product({ id: "c", name: "Água", categoryName: "Bebidas", available: false }),
  ];

  it("hides unavailable products", () => {
    const result = filterMenuProducts(catalog, {
      search: "",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("matches ignoring accents and case", () => {
    const result = filterMenuProducts(catalog, {
      search: "acai",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("searches the description and the category too", () => {
    expect(
      filterMenuProducts(catalog, {
        search: "condensado",
        categoryId: ALL_CATEGORY_ID,
      }).map((entry) => entry.id)
    ).toEqual(["b"]);

    expect(
      filterMenuProducts(catalog, {
        search: "bebidas",
        categoryId: ALL_CATEGORY_ID,
      }).map((entry) => entry.id)
    ).toEqual(["b"]);
  });

  it("narrows results when multiple words are typed", () => {
    expect(
      filterMenuProducts(catalog, {
        search: "copo morango",
        categoryId: ALL_CATEGORY_ID,
      }).map((entry) => entry.id)
    ).toEqual(["b"]);

    expect(
      filterMenuProducts(catalog, {
        search: "copo inexistente",
        categoryId: ALL_CATEGORY_ID,
      })
    ).toEqual([]);
  });

  it("filters by category", () => {
    const result = filterMenuProducts(catalog, {
      search: "",
      categoryId: categoryIdFromLabel("Bebidas"),
    });

    expect(result.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("combines category and search", () => {
    expect(
      filterMenuProducts(catalog, {
        search: "acai",
        categoryId: categoryIdFromLabel("Bebidas"),
      })
    ).toEqual([]);
  });
});

describe("buildMenuHighlights", () => {
  it("prefers explicitly featured products", () => {
    const highlights = buildMenuHighlights(
      [
        product({ id: "a" }),
        product({ id: "b", featured: true }),
      ],
      GENERIC
    );

    expect(highlights.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("falls back to active promotions after featured products", () => {
    const highlights = buildMenuHighlights(
      [
        product({ id: "a", basePrice: 20, promotionalPrice: 12 }),
        product({ id: "b", featured: true }),
      ],
      GENERIC
    );

    expect(highlights.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("returns empty when there is no highlight signal", () => {
    expect(buildMenuHighlights([product({ id: "a" })], GENERIC)).toEqual([]);
  });

  it("respects the niche highlight switch", () => {
    const adega = getNicheConfig("adega");

    expect(buildMenuHighlights([product({ featured: true })], adega)).toEqual([]);
  });

  it("caps the number of highlights", () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      product({ id: `p-${index}`, featured: true })
    );

    expect(buildMenuHighlights(many, GENERIC)).toHaveLength(
      GENERIC.rules.maxHighlights
    );
  });
});

describe("buildMenuCatalog", () => {
  const catalog = [
    product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí", featured: true }),
    product({ id: "b", name: "Copo de morango", categoryName: "Bebidas" }),
  ];

  it("reports an unfiltered catalog with highlights", () => {
    const result = buildMenuCatalog(catalog, GENERIC, {
      search: "",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.isFiltered).toBe(false);
    expect(result.isEmpty).toBe(false);
    expect(result.totalAvailable).toBe(2);
    expect(result.products).toHaveLength(2);
    expect(result.highlights.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("hides highlights while filtering so the results stay unambiguous", () => {
    const result = buildMenuCatalog(catalog, GENERIC, {
      search: "morango",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.isFiltered).toBe(true);
    expect(result.highlights).toEqual([]);
    expect(result.products.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("flags an empty result for a search with no matches", () => {
    const result = buildMenuCatalog(catalog, GENERIC, {
      search: "inexistente",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.isEmpty).toBe(true);
    expect(result.isFiltered).toBe(true);
  });

  it("omits category tabs when the niche disables them", () => {
    const config = {
      ...GENERIC,
      features: { ...GENERIC.features, showCategoryTabs: false },
    };

    expect(
      buildMenuCatalog(catalog, config, {
        search: "",
        categoryId: ALL_CATEGORY_ID,
      }).categories
    ).toEqual([]);
  });
});
