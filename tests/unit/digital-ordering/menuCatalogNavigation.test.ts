import { describe, expect, it } from "vitest";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import {
  ALL_CATEGORY_ID,
  buildMenuCatalog,
  buildMenuSections,
  categoryIdFromLabel,
  listNavigableCategories,
  resolveProductPrice,
} from "@/features/digital-ordering/menu/core/menuCatalog";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";
import { getMenuTemplate } from "@/features/digital-ordering/menu/templates/menuTemplateRegistry";
import { appearanceFromTemplate } from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
import {
  resolveMenuFeatures,
  sanitizeMenuFeatureOverrides,
} from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";
import type { MenuTemplateId } from "@/features/digital-ordering/menu/types/menuTemplate.types";

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
const products = [
  product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí", featured: true }),
  product({
    id: "b",
    name: "Copo de morango",
    categoryName: "Bebidas",
    description: "Com leite condensado",
  }),
  product({ id: "c", name: "Água", categoryName: "Bebidas", available: false }),
];

function sectionsConfig() {
  return {
    ...GENERIC,
    features: { ...GENERIC.features, catalogNavigation: "sections" as const },
  };
}

describe("catalogNavigation defaults", () => {
  it("food templates default to sections via the registry only", () => {
    const food: MenuTemplateId[] = [
      "acai",
      "cafeteria",
      "sushi",
      "burger",
      "icecream",
      "pastel",
      "marmita",
    ];

    for (const id of food) {
      expect(getMenuTemplate(id).defaults.features.catalogNavigation).toBe(
        "sections"
      );
      expect(getMenuTemplate(id).defaults.theme.productLayout).toBe("list");
      expect(appearanceFromTemplate(id).menuFeatures.catalogNavigation).toBe(
        "sections"
      );
    }
  });

  it("does not force sections on generic, services or retail templates", () => {
    for (const id of ["generic", "barbershop", "beauty", "retail", "services"] as const) {
      expect(
        getMenuTemplate(id).defaults.features.catalogNavigation ?? "filter"
      ).toBe("filter");
    }
    expect(getMenuTemplate("generic").defaults.theme.productLayout ?? "grid").toBe(
      "grid"
    );
    expect(getMenuTemplate("retail").defaults.theme.productLayout).toBe("grid");
  });

  it("store override wins over the template default", () => {
    const config = getNicheConfig("acai");
    expect(config.features.catalogNavigation).toBe("sections");
    expect(
      resolveMenuFeatures(config, { catalogNavigation: "filter" })
        .catalogNavigation
    ).toBe("filter");
  });

  it("ignores unknown catalogNavigation values so the template default remains", () => {
    expect(
      sanitizeMenuFeatureOverrides({
        catalogNavigation: "cards" as never,
      })
    ).toEqual({});
    expect(
      resolveMenuFeatures(getNicheConfig("acai"), {
        catalogNavigation: "cards" as never,
      }).catalogNavigation
    ).toBe("sections");
  });
});

describe("buildMenuCatalog sections mode", () => {
  it("exposes every category as a section without filtering the catalog", () => {
    const result = buildMenuCatalog(products, sectionsConfig(), {
      search: "",
      categoryId: categoryIdFromLabel("Açaí"),
    });

    expect(result.isFiltered).toBe(false);
    expect(result.products.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(result.sections.map((section) => section.categoryName)).toEqual([
      "Açaí",
      "Bebidas",
    ]);
    expect(result.highlights.map((entry) => entry.id)).toEqual(["a"]);
  });

  it("gives each section only its own products and never clones commercial data", () => {
    const result = buildMenuCatalog(products, sectionsConfig(), {
      search: "",
      categoryId: ALL_CATEGORY_ID,
    });

    const acai = result.sections.find((section) => section.categoryName === "Açaí");
    const drinks = result.sections.find(
      (section) => section.categoryName === "Bebidas"
    );

    expect(acai?.products.map((entry) => entry.id)).toEqual(["a"]);
    expect(drinks?.products.map((entry) => entry.id)).toEqual(["b"]);
    expect(acai?.products[0]).toBe(result.products[0]);
    expect(resolveProductPrice(acai!.products[0]).effectivePrice).toBe(20);
  });

  it("keeps search working and hides categories without matches", () => {
    const result = buildMenuCatalog(products, sectionsConfig(), {
      search: "morango",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.isFiltered).toBe(true);
    expect(result.products.map((entry) => entry.id)).toEqual(["b"]);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].categoryName).toBe("Bebidas");
    expect(
      listNavigableCategories(result.categories, "sections").map(
        (entry) => entry.label
      )
    ).toEqual(["Bebidas"]);
    expect(result.highlights).toEqual([]);
  });

  it("keeps matching featured products during search in sections mode", () => {
    const result = buildMenuCatalog(products, sectionsConfig(), {
      search: "acai",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.highlights.map((entry) => entry.id)).toEqual(["a"]);
    expect(result.sections.map((section) => section.categoryName)).toEqual([
      "Açaí",
    ]);
  });

  it("does not invent a featured section when showHighlights is off", () => {
    const result = buildMenuCatalog(
      products,
      {
        ...sectionsConfig(),
        features: { ...sectionsConfig().features, showHighlights: false },
      },
      { search: "", categoryId: ALL_CATEGORY_ID }
    );

    expect(result.highlights).toEqual([]);
    expect(result.sections.every((section) => section.categoryId !== "featured")).toBe(
      true
    );
  });

  it("does not invent empty sections for a search with no matches", () => {
    const result = buildMenuCatalog(products, sectionsConfig(), {
      search: "inexistente",
      categoryId: ALL_CATEGORY_ID,
    });

    expect(result.isEmpty).toBe(true);
    expect(result.sections).toEqual([]);
  });

  it("merges labels that slug to the same safe id", () => {
    const result = buildMenuCatalog(
      [
        product({ id: "a", name: "Shake 1", categoryName: "Milk Shake" }),
        product({ id: "b", name: "Shake 2", categoryName: "milk-shake" }),
        product({ id: "c", name: "Shake 3", categoryName: "Milk  Shake" }),
      ],
      sectionsConfig(),
      { search: "", categoryId: ALL_CATEGORY_ID }
    );

    const milk = result.sections.filter(
      (section) => section.categoryId === "milk-shake"
    );
    expect(milk).toHaveLength(1);
    expect(milk[0]?.products).toHaveLength(3);
    expect(result.sections.every((section) => !section.categoryId.includes(" "))).toBe(
      true
    );
  });
});

describe("buildMenuSections", () => {
  it("reuses product objects and skips empty groups", () => {
    const available = products.filter((entry) => entry.available !== false);
    const categories = [
      { id: ALL_CATEGORY_ID, label: "Tudo", productCount: 2 },
      { id: categoryIdFromLabel("Açaí"), label: "Açaí", productCount: 1 },
      { id: categoryIdFromLabel("Bebidas"), label: "Bebidas", productCount: 1 },
      { id: "ghost", label: "Vazia", productCount: 0 },
    ];

    const sections = buildMenuSections(available, categories);
    expect(sections.map((section) => section.categoryId)).toEqual([
      categoryIdFromLabel("Açaí"),
      categoryIdFromLabel("Bebidas"),
    ]);
    expect(sections[0].products[0]).toBe(available[0]);
  });
});
