import { describe, expect, it } from "vitest";
import {
  buildComboKitchenSummaryNamed,
  expandSaleItemChildren,
  validateComboFinalizeItem,
  type ContractCatalog,
} from "@/features/pdv/utils/comboFinalizeContract";
import { buildComboUnitSignatureKeys } from "@/features/pdv/utils/comboCartUnits";
import type { CartComboComponent } from "@/features/pdv/types/cart";

const ORG = "org-1";

function choiceCatalog(): ContractCatalog {
  return {
    organizationId: ORG,
    products: [
      {
        id: "combo-2",
        organizationId: ORG,
        name: "Combo 2 Açaís",
        price: 29.9,
        stock: 0,
        status: "active",
        menuKind: "combo",
        comboSelectionMode: "choice",
        comboMinChoices: 2,
        comboMaxChoices: 2,
      },
      {
        id: "combo-4",
        organizationId: ORG,
        name: "Combo 4 Açaís",
        price: 49.9,
        stock: 0,
        status: "active",
        menuKind: "combo",
        comboSelectionMode: "choice",
        comboMinChoices: 4,
        comboMaxChoices: 4,
      },
      {
        id: "mousse-morango",
        organizationId: ORG,
        name: "Açaí Mousse de Morango",
        price: 18.9,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "mousse-choc",
        organizationId: ORG,
        name: "Açaí Mousse de Chocolate",
        price: 18.9,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "ninho",
        organizationId: ORG,
        name: "Açaí Ninho",
        price: 19.9,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "morango",
        organizationId: ORG,
        name: "Açaí Morango",
        price: 17.9,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "extra-a",
        organizationId: ORG,
        name: "Extra A",
        price: 10,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "extra-b",
        organizationId: ORG,
        name: "Extra B",
        price: 10,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "simple-x",
        organizationId: ORG,
        name: "Suco",
        price: 8,
        stock: 20,
        status: "active",
        menuKind: "simple",
      },
      {
        id: "nested",
        organizationId: ORG,
        name: "Outro combo",
        price: 40,
        stock: 5,
        status: "active",
        menuKind: "combo",
      },
      {
        id: "inactive-cup",
        organizationId: ORG,
        name: "Inativo",
        price: 10,
        stock: 5,
        status: "inactive",
        menuKind: "assembled",
      },
      {
        id: "other-org-cup",
        organizationId: "org-2",
        name: "Outra org",
        price: 10,
        stock: 5,
        status: "active",
        menuKind: "assembled",
      },
    ],
    slots: [
      {
        id: "opt-mousse-morango",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "mousse-morango",
        quantity: 1,
        allowConfiguration: true,
        active: true,
        displayName: "Mousse de Morango",
      },
      {
        id: "opt-mousse-choc",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "mousse-choc",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "opt-ninho",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "ninho",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "opt-morango",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "morango",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-1",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "mousse-morango",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-2",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "mousse-choc",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-3",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "ninho",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-4",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "morango",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-5",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "extra-a",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "c4-6",
        organizationId: ORG,
        comboProductId: "combo-4",
        componentProductId: "extra-b",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "opt-simple",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "simple-x",
        quantity: 1,
        allowConfiguration: false,
        active: true,
      },
      {
        id: "opt-nested",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "nested",
        quantity: 1,
        allowConfiguration: false,
        active: true,
      },
      {
        id: "opt-inactive",
        organizationId: ORG,
        comboProductId: "combo-2",
        componentProductId: "inactive-cup",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "opt-other-org",
        organizationId: "org-2",
        comboProductId: "combo-2",
        componentProductId: "other-org-cup",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      // fixed regression combo
      {
        id: "fixed-a",
        organizationId: ORG,
        comboProductId: "fixed-combo",
        componentProductId: "mousse-morango",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "fixed-b",
        organizationId: ORG,
        comboProductId: "fixed-combo",
        componentProductId: "ninho",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
    ],
    options: [
      {
        id: "opt-nutella",
        organizationId: ORG,
        productId: "mousse-morango",
        groupId: "grp-extra",
        name: "Nutella",
        price: 3,
        active: true,
        stockControl: true,
        stock: 50,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
      {
        id: "opt-ovo",
        organizationId: ORG,
        productId: "mousse-morango",
        groupId: "grp-extra",
        name: "Ovomaltine",
        price: 2.5,
        active: true,
        stockControl: true,
        stock: 50,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
      {
        id: "opt-morango-extra",
        organizationId: ORG,
        productId: "ninho",
        groupId: "grp-ninho",
        name: "Morango",
        price: 2.5,
        active: true,
        stockControl: false,
        stock: 0,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
      {
        id: "opt-free-a",
        organizationId: ORG,
        productId: "mousse-morango",
        groupId: "grp-free",
        name: "Granola",
        price: 2,
        active: true,
        stockControl: false,
        stock: 0,
        maxFree: 1,
        maxSelection: 5,
        groupType: "optional",
      },
      {
        id: "opt-free-b",
        organizationId: ORG,
        productId: "mousse-morango",
        groupId: "grp-free",
        name: "Paçoca",
        price: 2,
        active: true,
        stockControl: false,
        stock: 0,
        maxFree: 1,
        maxSelection: 5,
        groupType: "optional",
      },
    ],
  };
}

// add fixed combo product
function catalog(): ContractCatalog {
  const base = choiceCatalog();
  return {
    ...base,
    products: [
      ...base.products,
      {
        id: "fixed-combo",
        organizationId: ORG,
        name: "Combo Fixo",
        price: 35,
        stock: 0,
        status: "active",
        menuKind: "combo",
        comboSelectionMode: "fixed",
      },
    ],
  };
}

describe("combo choice contract (028)", () => {
  it("1. Combo 2 / 4 opções / escolher 2 diferentes", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            label: "Copo 1",
            options: [],
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
            label: "Copo 2",
            options: [],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBe(29.9);
      expect(result.units).toHaveLength(2);
      expect(result.units[0].productId).toBe("mousse-morango");
      expect(result.units[1].productId).toBe("ninho");
    }
  });

  it("2. mesmo assembled ×2 sem addons", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            options: [],
          },
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 2,
            options: [],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.units).toHaveLength(2);
      expect(result.units[0].componentId).toBe(result.units[1].componentId);
      expect(result.units[0].unitIndex).not.toBe(result.units[1].unitIndex);
      const children = expandSaleItemChildren({
        parentQuantity: 1,
        units: result.units,
      });
      expect(children).toHaveLength(2);
      expect(children[0].comboUnitIndex).toBe(1);
      expect(children[1].comboUnitIndex).toBe(2);
    }
  });

  it("mesmo assembled ×2 com addons diferentes + persistência independente", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            label: "Copo 1",
            options: [{ option_id: "opt-nutella", quantity: 1 }],
          },
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 2,
            label: "Copo 2",
            options: [{ option_id: "opt-ovo", quantity: 1 }],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBeCloseTo(29.9 + 3 + 2.5, 5);
      const children = expandSaleItemChildren({
        parentQuantity: 1,
        units: result.units,
      });
      expect(children).toHaveLength(2);
      expect(children[0].options.map((o) => o.option_id)).toEqual([
        "opt-nutella",
      ]);
      expect(children[1].options.map((o) => o.option_id)).toEqual(["opt-ovo"]);
      const kds = buildComboKitchenSummaryNamed(
        result.units.map((unit) => ({
          ...unit,
          optionNames: {
            "opt-nutella": "Nutella",
            "opt-ovo": "Ovomaltine",
          },
        }))
      );
      expect(kds).toContain("COPO 1 — Açaí Mousse de Morango");
      expect(kds).toContain("+ Nutella");
      expect(kds).toContain("COPO 2 — Açaí Mousse de Morango");
      expect(kds).toContain("+ Ovomaltine");
      expect(kds).not.toContain("COPO 1 — Copo 1");
      expect(kds).not.toMatch(/[0-9a-f-]{36}/i);
    }
  });

  it("3. escolher somente 1 → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 1,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/entre 2 e 2/);
  });

  it("4. escolher 3 → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
          {
            component_id: "opt-morango",
            product_id: "morango",
            quantity: 1,
            unit_index: 3,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
  });

  it("5/6. Combo 4 / 6 opções / mesmo produto ×4", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-4",
        quantity: 1,
        components: [1, 2, 3, 4].map((unit_index) => ({
          component_id: "c4-1",
          product_id: "mousse-morango",
          quantity: 1 as const,
          unit_index,
          options: [],
        })),
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.units).toHaveLength(4);
      expect(result.unitPrice).toBe(49.9);
    }
  });

  it("7. produto simple como opção → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-simple",
            product_id: "simple-x",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/montado/);
  });

  it("8. produto combo como opção → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-nested",
            product_id: "nested",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/combo/);
  });

  it("9. produto inativo → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-inactive",
            product_id: "inactive-cup",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/inativo/i);
  });

  it("10. produto de outra organização → bloquear", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-other-org",
            product_id: "other-org-cup",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
  });

  it("11. preço do filho não entra no preço do combo", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBe(29.9);
      expect(result.unitPrice).not.toBeCloseTo(29.9 + 18.9 + 19.9, 5);
    }
  });

  it("addon pago em apenas uma unidade", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            options: [{ option_id: "opt-nutella", quantity: 1 }],
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
            options: [],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBeCloseTo(32.9, 5);
  });

  it("addon pago nas duas unidades", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            options: [{ option_id: "opt-nutella", quantity: 1 }],
          },
          {
            component_id: "opt-ninho",
            product_id: "ninho",
            quantity: 1,
            unit_index: 2,
            options: [{ option_id: "opt-morango-extra", quantity: 1 }],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBeCloseTo(29.9 + 3 + 2.5, 5);
  });

  it("max_free por unidade (não compartilha entre unidades)", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            options: [
              { option_id: "opt-free-a", quantity: 1 },
              { option_id: "opt-free-b", quantity: 1 },
            ],
          },
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 2,
            options: [
              { option_id: "opt-free-a", quantity: 1 },
              { option_id: "opt-free-b", quantity: 1 },
            ],
          },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      // max_free=1 por unidade → 1 pago × 2 unidades = +4
      expect(result.unitPrice).toBeCloseTo(29.9 + 2 + 2, 5);
    }
  });

  it("stock_control por unidade agrega corretamente", () => {
    const cat = catalog();
    cat.options = cat.options.map((opt) =>
      opt.id === "opt-nutella" ? { ...opt, stock: 1 } : opt
    );
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-2",
        quantity: 1,
        components: [
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 1,
            options: [{ option_id: "opt-nutella", quantity: 1 }],
          },
          {
            component_id: "opt-mousse-morango",
            product_id: "mousse-morango",
            quantity: 1,
            unit_index: 2,
            options: [{ option_id: "opt-nutella", quantity: 1 }],
          },
        ],
      },
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Estoque insuficiente para opção/);
  });

  it("carrinho diferencia ordem Nutella/Ovomaltine", () => {
    const a: CartComboComponent[] = [
      {
        componentId: "opt-mousse-morango",
        productId: "mousse-morango",
        productName: "Mousse",
        displayName: "Copo 1",
        quantity: 1,
        unitIndex: 1,
        allowConfiguration: true,
        selectedOptions: [
          {
            optionId: "opt-nutella",
            optionName: "Nutella",
            groupId: "g",
            groupName: "Extra",
            price: 3,
            quantity: 1,
          },
        ],
        addonsTotal: 3,
      },
      {
        componentId: "opt-mousse-morango",
        productId: "mousse-morango",
        productName: "Mousse",
        displayName: "Copo 2",
        quantity: 1,
        unitIndex: 2,
        allowConfiguration: true,
        selectedOptions: [
          {
            optionId: "opt-ovo",
            optionName: "Ovomaltine",
            groupId: "g",
            groupName: "Extra",
            price: 2.5,
            quantity: 1,
          },
        ],
        addonsTotal: 2.5,
      },
    ];
    const b: CartComboComponent[] = [
      { ...a[0], selectedOptions: a[1].selectedOptions, addonsTotal: 2.5 },
      { ...a[1], selectedOptions: a[0].selectedOptions, addonsTotal: 3 },
    ];
    expect(buildComboUnitSignatureKeys(a).join("|")).not.toBe(
      buildComboUnitSignatureKeys(b).join("|")
    );
  });

  it("fixed regression — ainda exige todos os slots", () => {
    const ok = validateComboFinalizeItem(
      {
        product_id: "fixed-combo",
        quantity: 1,
        components: [
          {
            component_id: "fixed-a",
            product_id: "mousse-morango",
            quantity: 1,
          },
          { component_id: "fixed-b", product_id: "ninho", quantity: 1 },
        ],
      },
      catalog()
    );
    expect(ok.ok).toBe(true);

    const bad = validateComboFinalizeItem(
      {
        product_id: "fixed-combo",
        quantity: 1,
        components: [
          {
            component_id: "fixed-a",
            product_id: "mousse-morango",
            quantity: 1,
          },
        ],
      },
      catalog()
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/exige todos/);
  });
});
