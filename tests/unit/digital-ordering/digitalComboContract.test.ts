import { describe, expect, it } from "vitest";
import {
  saleTotalFromValidatedLines,
  validateComboFinalizeItem,
  type ContractCatalog,
  type ContractComponentPayload,
  type ContractItemPayload,
} from "@/features/pdv/utils/comboFinalizeContract";
import { buildComboUnitSignatureKeys } from "@/features/pdv/utils/comboCartUnits";
import { buildCartItemSignature } from "@/features/pdv/utils/compositionPricing";
import type { CartComboComponent } from "@/features/pdv/types/cart";

/**
 * Espelha place_public_digital_order (027) — mesmas regras de combo da 026.
 */

const ORG = "org-digital";

function catalog(overrides?: Partial<ContractCatalog>): ContractCatalog {
  const base: ContractCatalog = {
    organizationId: ORG,
    products: [
      {
        id: "combo-1",
        organizationId: ORG,
        name: "Combo Família",
        price: 49.9,
        stock: 0,
        status: "active",
        menuKind: "combo",
      },
      {
        id: "acai-1",
        organizationId: ORG,
        name: "Açaí 500 ML",
        price: 22,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "acai-2",
        organizationId: ORG,
        name: "Açaí 500 ML",
        price: 22,
        stock: 20,
        status: "active",
        menuKind: "assembled",
      },
      {
        id: "nested",
        organizationId: ORG,
        name: "Combo Nested",
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
        stock: 30,
        status: "active",
        menuKind: "simple",
      },
      {
        id: "assembled-1",
        organizationId: ORG,
        name: "Copo",
        price: 25,
        stock: 15,
        status: "active",
        menuKind: "assembled",
      },
    ],
    slots: [
      {
        id: "slot-1",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-1",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "slot-2",
        organizationId: ORG,
        comboProductId: "combo-1",
        componentProductId: "acai-2",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
      {
        id: "slot-other",
        organizationId: ORG,
        comboProductId: "nested",
        componentProductId: "acai-1",
        quantity: 1,
        allowConfiguration: true,
        active: true,
      },
    ],
    options: [
      {
        id: "opt-m",
        organizationId: ORG,
        productId: "acai-1",
        groupId: "grp-extra",
        name: "Morango",
        price: 3,
        active: true,
        stockControl: true,
        stock: 40,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
      {
        id: "opt-o",
        organizationId: ORG,
        productId: "acai-1",
        groupId: "grp-extra",
        name: "Ovomaltine",
        price: 4,
        active: true,
        stockControl: false,
        stock: 0,
        maxFree: 0,
        maxSelection: 10,
        groupType: "optional",
      },
    ],
  };
  return { ...base, ...overrides, products: overrides?.products ?? base.products, slots: overrides?.slots ?? base.slots, options: overrides?.options ?? base.options };
}

function validCombo(
  components?: ContractComponentPayload[],
  extras?: Partial<ContractItemPayload>
): ContractItemPayload {
  return {
    product_id: "combo-1",
    quantity: extras?.quantity ?? 1,
    unit_price: extras?.unit_price ?? 0.01,
    components: components ?? [
      { component_id: "slot-1", product_id: "acai-1", quantity: 1, options: [] },
      { component_id: "slot-2", product_id: "acai-2", quantity: 1, options: [] },
    ],
  };
}

function comboSignature(components: CartComboComponent[]) {
  return buildCartItemSignature({
    productId: "combo-1",
    selectedOptionIds: [],
    observation: "",
    comboComponentKeys: buildComboUnitSignatureKeys(components),
  });
}

describe("digital combo contract (027 / place_public_digital_order)", () => {
  it("1. combo válido", () => {
    const result = validateComboFinalizeItem(validCombo(), catalog());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(49.9);
  });

  it("2. component_id inválido", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        { component_id: "missing", product_id: "acai-1", quantity: 1 },
        { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
      ]),
      catalog()
    );
    expect(result.ok).toBe(false);
  });

  it("3. component_id de outro combo", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        { component_id: "slot-other", product_id: "acai-1", quantity: 1 },
        { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
      ]),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não pertence/);
  });

  it("4. produto filho incorreto", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        { component_id: "slot-1", product_id: "acai-2", quantity: 1 },
        { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
      ]),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não confere/);
  });

  it("5. slot inativo", () => {
    const cat = catalog({
      slots: [
        {
          id: "slot-dead",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-1",
          quantity: 1,
          allowConfiguration: true,
          active: false,
        },
        {
          id: "slot-live",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "acai-2",
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
          { component_id: "slot-dead", product_id: "acai-1", quantity: 1 },
        ],
      },
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/inativo/);
  });

  it("6. quantity incorreta", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        { component_id: "slot-1", product_id: "acai-1", quantity: 9 },
        { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
      ]),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Quantidade inválida/);
  });

  it("7. component duplicado", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        { component_id: "slot-1", product_id: "acai-1", quantity: 1 },
        { component_id: "slot-1", product_id: "acai-1", quantity: 1 },
      ]),
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/duplicado|exige todos/);
  });

  it("8. slot ausente", () => {
    const result = validateComboFinalizeItem(
      {
        product_id: "combo-1",
        quantity: 1,
        components: [
          { component_id: "slot-1", product_id: "acai-1", quantity: 1 },
        ],
      },
      catalog()
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/exige todos/);
  });

  it("9. allow_configuration=false com options", () => {
    const cat = catalog({
      slots: catalog().slots.map((s) =>
        s.id === "slot-1" ? { ...s, allowConfiguration: false } : s
      ),
    });
    const result = validateComboFinalizeItem(
      validCombo([
        {
          component_id: "slot-1",
          product_id: "acai-1",
          quantity: 1,
          options: [{ option_id: "opt-m", quantity: 1 }],
        },
        { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
      ]),
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não permite options/);
  });

  it("10. nested combo", () => {
    const cat = catalog({
      slots: [
        {
          id: "slot-nested",
          organizationId: ORG,
          comboProductId: "combo-1",
          componentProductId: "nested",
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
          { component_id: "slot-nested", product_id: "nested", quantity: 1 },
          { component_id: "slot-2", product_id: "acai-2", quantity: 1 },
        ],
      },
      cat
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/não pode ser combo/);
  });

  it("11. preço adulterado pelo cliente", () => {
    const result = validateComboFinalizeItem(
      validCombo(undefined, { unit_price: 0.01 }),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBe(49.9);
      const totals = saleTotalFromValidatedLines(
        [{ lineSubtotal: result.lineSubtotal }],
        0
      );
      expect("total" in totals && totals.total).toBe(49.9);
    }
  });

  it("12. max_free", () => {
    const cat = catalog({
      options: catalog().options.map((o) => ({ ...o, maxFree: 3 })),
    });
    const result = validateComboFinalizeItem(
      validCombo([
        {
          component_id: "slot-1",
          product_id: "acai-1",
          options: [
            { option_id: "opt-m", quantity: 1 },
            { option_id: "opt-o", quantity: 1 },
          ],
        },
        { component_id: "slot-2", product_id: "acai-2" },
      ]),
      cat
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(49.9);
  });

  it("13. adicionais pagos", () => {
    const result = validateComboFinalizeItem(
      validCombo([
        {
          component_id: "slot-1",
          product_id: "acai-1",
          options: [
            { option_id: "opt-m", quantity: 1 },
            { option_id: "opt-o", quantity: 1 },
          ],
        },
        { component_id: "slot-2", product_id: "acai-2" },
      ]),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBeCloseTo(56.9, 5);
  });

  it("14. estoque do componente", () => {
    const result = validateComboFinalizeItem(validCombo(undefined, { quantity: 3 }), catalog());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stockMoves.find((m) => m.id === "acai-1")?.quantity).toBe(3);
      expect(result.stockMoves.find((m) => m.id === "acai-2")?.quantity).toBe(3);
      expect(result.stockMoves.some((m) => m.id === "combo-1")).toBe(false);
    }
  });

  it("15. estoque das opções", () => {
    const result = validateComboFinalizeItem(
      validCombo(
        [
          {
            component_id: "slot-1",
            product_id: "acai-1",
            options: [{ option_id: "opt-m", quantity: 1 }],
          },
          { component_id: "slot-2", product_id: "acai-2" },
        ],
        { quantity: 2 }
      ),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stockMoves.find((m) => m.id === "opt-m")?.quantity).toBe(2);
    }
  });

  it("16. combo + quantidade > 1", () => {
    const result = validateComboFinalizeItem(
      validCombo(
        [
          {
            component_id: "slot-1",
            product_id: "acai-1",
            options: [{ option_id: "opt-o", quantity: 1 }],
          },
          { component_id: "slot-2", product_id: "acai-2" },
        ],
        { quantity: 2 }
      ),
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unitPrice).toBeCloseTo(53.9, 5);
      expect(result.lineSubtotal).toBeCloseTo(107.8, 5);
    }
  });

  it("17/18. edição e duas configurações diferentes no carrinho", () => {
    const configA: CartComboComponent[] = [
      {
        componentId: "slot-1",
        productId: "acai-1",
        productName: "Açaí",
        displayName: "Açaí 1",
        quantity: 1,
        unitIndex: 1,
        allowConfiguration: true,
        selectedOptions: [
          {
            optionId: "opt-m",
            optionName: "Morango",
            groupId: "g",
            groupName: "Extra",
            price: 3,
            quantity: 1,
          },
        ],
        addonsTotal: 3,
      },
      {
        componentId: "slot-2",
        productId: "acai-2",
        productName: "Açaí",
        displayName: "Açaí 2",
        quantity: 1,
        unitIndex: 2,
        allowConfiguration: true,
        selectedOptions: [],
        addonsTotal: 0,
      },
    ];
    const configB: CartComboComponent[] = [
      {
        ...configA[0],
        selectedOptions: [
          {
            optionId: "opt-o",
            optionName: "Ovomaltine",
            groupId: "g",
            groupName: "Extra",
            price: 4,
            quantity: 1,
          },
        ],
        addonsTotal: 4,
      },
      configA[1],
    ];
    expect(comboSignature(configA)).not.toBe(comboSignature(configB));
    // replaceItemId path: same line id keeps identity — signature change still distinct lines if not editing
    expect(comboSignature(configA)).toBe(comboSignature(configA));
  });

  it("19. produto simple continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "simple-1", quantity: 2, unit_price: 8 },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lineSubtotal).toBe(16);
  });

  it("20. produto assembled continua funcionando", () => {
    const result = validateComboFinalizeItem(
      { product_id: "assembled-1", quantity: 1, unit_price: 25 },
      catalog()
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.unitPrice).toBe(25);
  });
});
