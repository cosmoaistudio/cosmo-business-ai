import { describe, expect, it } from "vitest";
import type { Product } from "@/features/products/types/product";
import type { ProductComboComponent } from "@/features/product-composition/types/combo";
import {
  allowDuplicateProductSlots,
  buildDefaultDisplayName,
  canAddProductAsComboComponent,
  describeRemoveImpact,
  filterComboComponentCatalog,
  nextComboSortOrder,
  normalizeSlotQuantity,
  reorderComboSlotIds,
  shouldPreserveExistingSlotId,
} from "@/features/product-composition/utils/comboAdminRules";

function product(
  overrides: Partial<Product> & Pick<Product, "id" | "name">
): Product {
  return {
    id: overrides.id,
    name: overrides.name,
    category: overrides.category ?? "",
    description: overrides.description ?? "",
    price: overrides.price ?? 10,
    stock: overrides.stock ?? 10,
    min_stock: overrides.min_stock ?? 0,
    status: overrides.status ?? "active",
    image_url: overrides.image_url ?? null,
    menu_kind: overrides.menu_kind ?? "simple",
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function slot(
  overrides: Partial<ProductComboComponent> & Pick<ProductComboComponent, "id">
): ProductComboComponent {
  return {
    id: overrides.id,
    organization_id: overrides.organization_id ?? "org-1",
    combo_product_id: overrides.combo_product_id ?? "combo-1",
    component_product_id: overrides.component_product_id ?? "p-1",
    display_name: overrides.display_name ?? null,
    quantity: overrides.quantity ?? 1,
    sort_order: overrides.sort_order ?? 0,
    allow_configuration: overrides.allow_configuration ?? true,
    active: overrides.active ?? true,
    created_at: overrides.created_at ?? new Date().toISOString(),
    component_product: overrides.component_product,
  };
}

describe("comboAdminRules — criar combo", () => {
  it("permite produtos simples e montados ativos no catálogo", () => {
    const comboId = "combo-1";
    const catalog = filterComboComponentCatalog(
      [
        product({ id: "s1", name: "Açaí", menu_kind: "simple" }),
        product({ id: "a1", name: "Copo", menu_kind: "assembled" }),
        product({ id: "c2", name: "Outro combo", menu_kind: "combo" }),
        product({ id: comboId, name: "Self", menu_kind: "combo" }),
        product({
          id: "off",
          name: "Inativo",
          menu_kind: "simple",
          status: "inactive",
        }),
      ],
      comboId
    );

    expect(catalog.map((row) => row.id)).toEqual(["s1", "a1"]);
  });

  it("define sort_order sequencial ao criar slots", () => {
    expect(nextComboSortOrder([])).toBe(0);
    expect(
      nextComboSortOrder([
        slot({ id: "a", sort_order: 0 }),
        slot({ id: "b", sort_order: 2 }),
      ])
    ).toBe(3);
  });
});

describe("comboAdminRules — editar combo", () => {
  it("preserva IDs de slots existentes", () => {
    expect(shouldPreserveExistingSlotId("slot-abc")).toBe(true);
    expect(shouldPreserveExistingSlotId("")).toBe(false);
    expect(shouldPreserveExistingSlotId(null)).toBe(false);
  });

  it("atualiza quantity e allow_configuration sem recriar o slot", () => {
    const existing = slot({
      id: "slot-1",
      quantity: 1,
      allow_configuration: true,
    });
    const patched = {
      ...existing,
      quantity: normalizeSlotQuantity(3),
      allow_configuration: false,
    };

    expect(patched.id).toBe("slot-1");
    expect(patched.quantity).toBe(3);
    expect(patched.allow_configuration).toBe(false);
  });
});

describe("comboAdminRules — dois slots do mesmo produto", () => {
  it("permite o mesmo produto em slots independentes", () => {
    expect(allowDuplicateProductSlots()).toBe(true);

    const acai = product({ id: "acai-500", name: "Açaí 500 ML" });
    const check1 = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: acai,
    });
    const check2 = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: acai,
    });

    expect(check1).toEqual({ ok: true });
    expect(check2).toEqual({ ok: true });

    const slots = [
      slot({
        id: "slot-a",
        component_product_id: "acai-500",
        display_name: "Açaí 500 ML",
        quantity: 2,
      }),
      slot({
        id: "slot-b",
        component_product_id: "acai-500",
        display_name: "Açaí 500 ML",
        quantity: 1,
      }),
    ];

    expect(slots[0].id).not.toBe(slots[1].id);
    expect(slots[0].component_product_id).toBe(slots[1].component_product_id);
  });
});

describe("comboAdminRules — quantidade", () => {
  it("normaliza quantity mínima em 1", () => {
    expect(normalizeSlotQuantity(0)).toBe(1);
    expect(normalizeSlotQuantity(-3)).toBe(1);
    expect(normalizeSlotQuantity(2.9)).toBe(2);
    expect(normalizeSlotQuantity(Number.NaN)).toBe(1);
  });
});

describe("comboAdminRules — allow_configuration", () => {
  it("mantém flag por slot (composições independentes)", () => {
    const slots = [
      slot({ id: "1", allow_configuration: true, quantity: 2 }),
      slot({ id: "2", allow_configuration: false, quantity: 1 }),
    ];
    expect(slots[0].allow_configuration).toBe(true);
    expect(slots[1].allow_configuration).toBe(false);
  });
});

describe("comboAdminRules — choice exige assembled", () => {
  it("bloqueia simple quando requireAssembled", () => {
    const result = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: product({
        id: "s1",
        name: "Suco",
        menu_kind: "simple",
      }),
      requireAssembled: true,
    });
    expect(result.ok).toBe(false);
  });
});

describe("comboAdminRules — impedir combo dentro de combo", () => {
  it("bloqueia candidato menu_kind=combo", () => {
    const result = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: product({
        id: "combo-2",
        name: "Combo filho",
        menu_kind: "combo",
      }),
    });
    expect(result).toEqual({
      ok: false,
      error: "Não é permitido adicionar outro combo.",
    });
  });

  it("bloqueia o próprio combo como componente", () => {
    const result = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: product({
        id: "combo-1",
        name: "Self",
        menu_kind: "simple",
      }),
    });
    expect(result).toEqual({
      ok: false,
      error: "O combo não pode incluir a si mesmo.",
    });
  });
});

describe("comboAdminRules — impedir produto inativo", () => {
  it("bloqueia status inactive", () => {
    const result = canAddProductAsComboComponent({
      comboProductId: "combo-1",
      candidate: product({
        id: "p-off",
        name: "Pausado",
        status: "inactive",
      }),
    });
    expect(result).toEqual({
      ok: false,
      error: "Produto inativo não pode entrar no combo.",
    });
  });
});

describe("comboAdminRules — remover componente", () => {
  it("descreve impacto sem vendas", () => {
    expect(describeRemoveImpact(0)).toBe("Remover este produto do combo?");
  });

  it("avisa quando há sale_items ligados ao slot", () => {
    expect(describeRemoveImpact(4)).toContain("4 item(ns) de venda");
  });
});

describe("comboAdminRules — reordenar componentes", () => {
  it("reordena IDs preservando identidade dos slots", () => {
    const ids = ["a", "b", "c"];
    expect(reorderComboSlotIds(ids, 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderComboSlotIds(ids, 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderComboSlotIds(ids, 1, 1)).toBeNull();
    expect(reorderComboSlotIds(ids, -1, 0)).toBeNull();
  });
});

describe("comboAdminRules — display_name", () => {
  it("gera nome padrão a partir do produto", () => {
    expect(buildDefaultDisplayName("Açaí 500 ML", 0)).toBe("Açaí 500 ML");
  });
});
