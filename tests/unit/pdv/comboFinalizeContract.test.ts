import { describe, expect, it } from "vitest";
import {
  saleTotalFromValidatedLines,
  validateComboFinalizeItem,
  type ContractCatalog,
  type ContractComponentPayload,
  type ContractItemPayload,
} from "@/features/pdv/utils/comboFinalizeContract";
import {
  calculateComboUnitPrice,
  calculateComponentAddonsTotal,
} from "@/features/product-engine/utils/comboPricing";
import type {
  EngineProductNode,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";

const ORG = "org-1";
const OTHER_ORG = "org-2";

function catalog(overrides?: Partial<ContractCatalog>): ContractCatalog {
  const base: ContractCatalog = {
    organizationId: ORG,
    products: [
      {
        id: "combo-1",
        organizationId: ORG,
        name: "Combo 2 Açaís",
        price: 29.9,
        stock: 0,
        status: "active",
        menuKind: "combo",
      },
      {
        id: "acai-a",
        organizationId: ORG,
        name: "Açaí A",
        price: 18.9,
        stock: 10,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "acai-b",
        organizationId: ORG,
        name: "Açaí B",
        price: 18.9,
        stock: 10,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "nested-combo",
        organizationId: ORG,
        name: "Nested",
        price: 40,
        stock: 5,
        status: "active",
        menuKind: "combo",
      },
      {
        id: "simple-1",
        organizationId: ORG,
        name: "Suco",
        price: 8,
        stock: 20,
        status: "active",
        menuKind: "simple",
      },
      {
        id: "assembled-1",
        organizationId: ORG,
        name: "Copo Montado",
        price: 22,
        stock: 15,
        status: "active",
        menuKind: "assembled",
      },
    ],
    slots: [
      {
        id: "slot-a",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-a",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "slot-b",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-b",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "slot-other-combo",
        organizationId: ORG,
        comboProductId: "nested-combo",
        componentProductId: "acai-a",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
    ],
    options: [
      {
        id: "opt-n",
        organizationId: ORG,
        productId: "acai-a",
        groupId: "grp-extra",
        name: "Nutella",
        price: 4,
        active: true,
        stockControl: true,
        stock: 50,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
      {
        id: "opt-o",
        organizationId: ORG,
        productId: "acai-a",
        groupId: "grp-extra",
        name: "Ovomaltine",
        price: 3,
        active: true,
        stockControl: false,
        stock: 0,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
    ],
  };
  return {
    ...base,
    ...overrides,
    products: overrides?.products ?? base.products,
    slots: overrides?.slots ?? base.slots,
    options: overrides?.options ?? base.options,
  };
}

function validComboPayload(overrides?: {
  components?: ContractComponentPayload[];
  unit_price?: number;
  quantity?: number;
}): ContractItemPayload {
  return {
    product_id: "combo-1",
    quantity: overrides?.quantity ?? 1,
    unit_price: overrides?.unit_price ?? 1,
    components: overrides?.components ?? [
      { component_id: "slot-a", product_id: "acai-a", quantity: 1, options: [] },
      { component_id: "slot-b", product_id: "acai-b", quantity: 1, options: [] },
    ],
  };
}

describe("comboFinalizeContract (espelha finalize_sale 026)", () => {
  it("aceita component_id pertencente ao combo", () => {
    const result = validateComboFinalizeItem(validComboPayload(), catalog());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(29.9);
  });

  it("rejeita component_id de outro combo", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-other-combo",
            product_id: "acai-a",
            quantity: 1,
          },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não pertence ao combo/);
  });

  it("rejeita product_id diferente do slot", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          { component_id: "slot-a", product_id: "acai-b", quantity: 1 },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não confere com o slot/);
  });

  it("rejeita slot inactive", () => {
    const cat = catalog({
      slots: catalog().slots.map((s) =>
        s.id === "slot-b" ? { ...s, active: false } : s
      ),
    });

    const rejectCount = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        components: [
          { component_id: "slot-a", product_id: "acai-a", quantity: 1 },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      },
      cat
    );
    expect(rejectCount.ok).toBe(false);
    if (!rejectCount.ok) {
      expect(rejectCount.error).toMatch(/exige todos os 1 componentes/);
    }

    // força count=1 com slot inativo (simula bypass do count)
    const catOnlyInactiveActiveFlag = catalog({
      slots: [
        {
          id: "slot-b",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-b",
          quantity: 1,
          allowConfiguration: true,
          active: false,
        },
        {
          id: "slot-dummy-active",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-a",
          quantity: 1,
          allowConfiguration: true,
          active: true,
        },
      ],
    });
    const rejectInactive = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        components: [
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      },
      catOnlyInactiveActiveFlag
    );
    expect(rejectInactive.ok).toBe(false);
    if (!rejectInactive.ok) {
      expect(rejectInactive.error).toMatch(/Componente inativo/);
    }
  });

  it("rejeita quantidade inválida (diferente do slot)", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          { component_id: "slot-a", product_id: "acai-a", quantity: 9 },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Quantidade inválida/);
  });

  it("allow_configuration=false rejeita options", () => {
    const cat = catalog({
      slots: catalog().slots.map((s) =>
        s.id === "slot-a" ? { ...s, allowConfiguration: false } : s
      ),
    });
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            quantity: 1,
            options: [{ option_id: "opt-n", quantity: 1 }],
          },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não permite options/);
  });

  it("allow_configuration=true aceita options válidas e soma addons", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            quantity: 1,
            options: [{ option_id: "opt-n", quantity: 1 }],
          },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBeCloseTo(33.9, 5);
  });

  it("rejeita nested combo", () => {
    const cat = catalog({
      slots: [
        {
          id: "slot-nested",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "nested-combo",
          quantity: 1,
          allowConfiguration: false,
          active: true,
        },
        catalog().slots[1],
      ],
    });
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        components: [
          {
            component_id: "slot-nested",
            product_id: "nested-combo",
            quantity: 1,
          },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      },
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não pode ser combo/);
  });

  it("rejeita organization diferente", () => {
    const cat = catalog({
      slots: [
        {
          id: "slot-foreign",
          organizationId: OTHER_ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-a",
          quantity: 1,
          allowConfiguration: true,
          active: true,
        },
        {
          id: "slot-b",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-b",
          quantity: 1,
          allowConfiguration: true,
          active: true,
        },
      ],
    });
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        components: [
          { component_id: "slot-foreign", product_id: "acai-a", quantity: 1 },
        ],
      },
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/outra organização/);
  });

  it("preço do combo não soma preço base dos filhos", () => {
    const result = validateComboFinalizeItem(validComboPayload(), catalog());
    expect(result.ok).toBe(true);
    if (result.ok) {
      // 29.9, NÃO 29.9+18.9+18.9
      expect(result.unitPrice).toBe(29.9);
    }
  });

  it("adicionais pagos aumentam preço", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            options: [
              { option_id: "opt-n", quantity: 1 },
              { option_id: "opt-o", quantity: 1 },
            ],
          },
          { component_id: "slot-b", product_id: "acai-b" },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBeCloseTo(36.9, 5);
  });

  it("max_free por componente", () => {
    const cat = catalog({
      options: catalog().options.map((o) => ({ ...o, maxFree: 3 })),
    });
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            options: [
              { option_id: "opt-n", quantity: 1 },
              { option_id: "opt-o", quantity: 1 },
            ],
          },
          { component_id: "slot-b", product_id: "acai-b" },
        ],
      }),
      cat
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(29.9);
  });

  it("preço enviado pelo cliente não manipula total", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({ unit_price: 0.01 }),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBe(29.9);
      expect(result.lineSubtotal).toBe(29.9);
    }
    const totals = saleTotalFromValidatedLines(
      [{ lineSubtotal: result.ok ? result.lineSubtotal : 0 }],
      5
    );
    expect("total" in totals && totals.total).toBe(24.9);
  });

  it("baixa estoque efetiva = slot.quantity * N nos componentes", () => {
    const cat = catalog({
      slots: catalog().slots.map((s) =>
        s.id === "slot-a" ? { ...s, quantity: 2 } : s
      ),
    });
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 3,
        components: [
          { component_id: "slot-a", product_id: "acai-a", quantity: 2 },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      },
      cat
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const moveA = result.stockMoves.find((m) => m.id === "acai-a");
      const moveB = result.stockMoves.find((m) => m.id === "acai-b");
      expect(moveA?.quantity).toBe(6); // 2 * 3
      expect(moveB?.quantity).toBe(3); // 1 * 3
    }
  });

  it("baixa estoque de opções com stock_control", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        quantity: 2,
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            options: [{ option_id: "opt-n", quantity: 1 }],
          },
          { component_id: "slot-b", product_id: "acai-b" },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const optMove = result.stockMoves.find((m) => m.id === "opt-n");
      expect(optMove?.kind).toBe("option");
      expect(optMove?.quantity).toBe(2); // 1 * (slot 1 * N 2)
    }
  });

  it("venda simple continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "simple-1", quantity: 2, unit_price: 8 },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBe(8);
      expect(result.stockMoves).toEqual([
        { kind: "product", id: "simple-1", quantity: 2 },
      ]);
    }
  });

  it("venda assembled continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "assembled-1", quantity: 1, unit_price: 22 },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lineSubtotal).toBe(22);
  });

  it("rejeita component_id nulo", () => {
    const result = validateComboFinalizeItem(
      validComboPayload({
        components: [
          { product_id: "acai-a", quantity: 1 },
          { component_id: "slot-b", product_id: "acai-b", quantity: 1 },
        ],
      }),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/component_id obrigatório/);
  });
});

describe("comboPricing alinhado ao contrato de servidor", () => {
  function node(maxFree: number): EngineProductNode {
    return {
      productId: "acai-a",
      productName: "Açaí A",
      basePrice: 18.9,
      status: "active",
      groups: [
        {
          id: "grp-extra",
          name: "Adicionais",
          description: null,
          sortOrder: 0,
          type: "optional",
          selectionType: "checkbox",
          required: false,
          active: true,
          minSelection: 0,
          maxSelection: 10,
          maxFree,
          allowsRepeat: false,
          allowsQuantity: true,
          hidden: false,
          optionIds: ["opt-n"],
        },
      ],
      optionsByGroupId: {
        "grp-extra": [
          {
            id: "opt-n",
            groupId: "grp-extra",
            name: "Nutella",
            description: null,
            imageUrl: null,
            price: 4,
            stock: 10,
            stockControl: false,
            sku: null,
            sortOrder: 0,
            active: true,
            premium: false,
            weight: 0,
          },
        ],
      },
    };
  }

  const sel: EngineSelectionItem = {
    groupId: "grp-extra",
    groupName: "Adicionais",
    optionId: "opt-n",
    optionName: "Nutella",
    quantity: 1,
    unitPrice: 4,
    premium: false,
  };

  it("engine e contrato batem no preço com addons", () => {
    const engine = calculateComboUnitPrice(29.9, [
      {
        componentId: "slot-a",
        slotQuantity: 1,
        node: node(0),
        selections: { "grp-extra": [sel] },
        allowConfiguration: true,
      },
      {
        componentId: "slot-b",
        slotQuantity: 1,
        node: null,
        selections: {},
        allowConfiguration: true,
      },
    ]);
    const contract = validateComboFinalizeItem(
      validComboPayload({
        components: [
          {
            component_id: "slot-a",
            product_id: "acai-a",
            options: [{ option_id: "opt-n", quantity: 1 }],
          },
          { component_id: "slot-b", product_id: "acai-b" },
        ],
      }),
      catalog()
    );
    expect(contract.ok).toBe(true);
    if (contract.ok) expect(contract.unitPrice).toBe(engine);
  });

  it("slotQuantity multiplica apenas addons", () => {
    expect(
      calculateComponentAddonsTotal({
        componentId: "slot-a",
        slotQuantity: 2,
        node: node(0),
        selections: { "grp-extra": [sel] },
        allowConfiguration: true,
      })
    ).toBe(8);
  });
});
