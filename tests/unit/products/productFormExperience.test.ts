import { describe, expect, it } from "vitest";
import {
  extractProductCategories,
  filterCategorySuggestions,
  isNewCategoryValue,
} from "@/features/products/utils/productCategories";
import {
  buildProductFormChecklist,
  summarizeProductChecklist,
} from "@/features/products/utils/productFormChecklist";

describe("productCategories", () => {
  it("extrai categorias únicas ordenadas (case-insensitive)", () => {
    expect(
      extractProductCategories([
        { category: "Açaí" },
        { category: "açaí" },
        { category: "Bebidas" },
        { category: "  " },
        { category: null },
      ])
    ).toEqual(["Açaí", "Bebidas"]);
  });

  it("filtra sugestões pelo texto digitado", () => {
    const all = ["Açaí", "Milkshake", "Bebidas", "Combos"];
    expect(filterCategorySuggestions(all, "be")).toEqual(["Bebidas"]);
    expect(filterCategorySuggestions(all, "").length).toBeLessThanOrEqual(8);
  });

  it("detecta categoria nova sem inventar entidade", () => {
    expect(isNewCategoryValue(["Açaí"], "Sobremesas")).toBe(true);
    expect(isNewCategoryValue(["Açaí"], "açaí")).toBe(false);
    expect(isNewCategoryValue(["Açaí"], "  ")).toBe(false);
  });
});

describe("productFormChecklist", () => {
  it("marca obrigatórios vs opcionais sem invalidar produto sem foto", () => {
    const items = buildProductFormChecklist({
      name: "Açaí 500ml",
      category: "Açaí",
      price: "18",
      description: "",
      imageUrl: "",
      hasAddons: false,
    });

    const summary = summarizeProductChecklist(items);
    expect(summary.readyToSave).toBe(true);
    expect(items.find((i) => i.id === "photo")?.kind).toBe("optional");
    expect(items.find((i) => i.id === "photo")?.done).toBe(false);
    expect(items.find((i) => i.id === "name")?.done).toBe(true);
  });

  it("produto mínimo incompleto sem nome", () => {
    const items = buildProductFormChecklist({
      name: "",
      category: "Açaí",
      price: "10",
    });
    expect(summarizeProductChecklist(items).readyToSave).toBe(false);
  });

  it("preview checklist com imagem e adicionais", () => {
    const items = buildProductFormChecklist({
      name: "X",
      category: "Y",
      price: "1",
      imageUrl: "https://cdn.example/p.webp",
      description: "desc",
      hasAddons: true,
      showComposition: true,
      hasComposition: true,
    });
    expect(items.find((i) => i.id === "photo")?.done).toBe(true);
    expect(items.find((i) => i.id === "addons")?.done).toBe(true);
    expect(items.find((i) => i.id === "composition")?.done).toBe(true);
  });

  it("oculta categoria obrigatória em combo", () => {
    const items = buildProductFormChecklist({
      name: "Combo",
      category: "",
      price: "40",
      hideCategory: true,
    });
    expect(items.find((i) => i.id === "category")).toBeUndefined();
    expect(summarizeProductChecklist(items).readyToSave).toBe(true);
  });
});
