import { describe, expect, it } from "vitest";
import {
  calculateComboUnitPrice,
  calculateComponentAddonsTotal,
} from "@/features/product-engine/utils/comboPricing";
import type {
  EngineProductNode,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";
import { buildCartItemSignature } from "@/features/pdv/utils/compositionPricing";

function childNode(maxFree: number): EngineProductNode {
  return {
    productId: "acai-500",
    productName: "Açaí 500 ml",
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
        optionIds: ["opt-n", "opt-o"],
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
        {
          id: "opt-o",
          groupId: "grp-extra",
          name: "Ovomaltine",
          description: null,
          imageUrl: null,
          price: 3,
          stock: 10,
          stockControl: false,
          sku: null,
          sortOrder: 1,
          active: true,
          premium: false,
          weight: 0,
        },
      ],
    },
  };
}

function sel(
  optionId: string,
  optionName: string,
  unitPrice: number
): EngineSelectionItem {
  return {
    groupId: "grp-extra",
    groupName: "Adicionais",
    optionId,
    optionName,
    quantity: 1,
    unitPrice,
    premium: false,
  };
}

describe("comboPricing", () => {
  it("preço do combo é base fixa sem somar preço dos filhos", () => {
    const total = calculateComboUnitPrice(29.9, [
      {
        componentId: "c1",
        slotQuantity: 1,
        node: childNode(0),
        selections: {},
        allowConfiguration: true,
      },
      {
        componentId: "c2",
        slotQuantity: 1,
        node: childNode(0),
        selections: {},
        allowConfiguration: true,
      },
    ]);
    expect(total).toBe(29.9);
  });

  it("soma adicionais pagos por componente independentemente", () => {
    const c1 = calculateComponentAddonsTotal({
      componentId: "c1",
      slotQuantity: 1,
      node: childNode(0),
      selections: { "grp-extra": [sel("opt-n", "Nutella", 4)] },
      allowConfiguration: true,
    });
    const c2 = calculateComponentAddonsTotal({
      componentId: "c2",
      slotQuantity: 1,
      node: childNode(0),
      selections: { "grp-extra": [sel("opt-o", "Ovomaltine", 3)] },
      allowConfiguration: true,
    });
    expect(c1).toBe(4);
    expect(c2).toBe(3);
    expect(calculateComboUnitPrice(29.9, [
      {
        componentId: "c1",
        slotQuantity: 1,
        node: childNode(0),
        selections: { "grp-extra": [sel("opt-n", "Nutella", 4)] },
        allowConfiguration: true,
      },
      {
        componentId: "c2",
        slotQuantity: 1,
        node: childNode(0),
        selections: { "grp-extra": [sel("opt-o", "Ovomaltine", 3)] },
        allowConfiguration: true,
      },
    ])).toBeCloseTo(36.9, 5);
  });

  it("max_free é por componente (não soma limites)", () => {
    const freeNode = childNode(3);
    const paid = calculateComponentAddonsTotal({
      componentId: "c1",
      slotQuantity: 1,
      node: freeNode,
      selections: {
        "grp-extra": [
          sel("opt-n", "Nutella", 4),
          sel("opt-o", "Ovomaltine", 3),
        ],
      },
      allowConfiguration: true,
    });
    // 2 selections <= maxFree 3 → grátis neste componente
    expect(paid).toBe(0);
  });

  it("slot quantity multiplica só addons, não a base do combo", () => {
    const addons = calculateComponentAddonsTotal({
      componentId: "c1",
      slotQuantity: 2,
      node: childNode(0),
      selections: { "grp-extra": [sel("opt-n", "Nutella", 4)] },
      allowConfiguration: true,
    });
    expect(addons).toBe(8);
    expect(
      calculateComboUnitPrice(29.9, [
        {
          componentId: "c1",
          slotQuantity: 2,
          node: childNode(0),
          selections: { "grp-extra": [sel("opt-n", "Nutella", 4)] },
          allowConfiguration: true,
        },
      ])
    ).toBeCloseTo(37.9, 5);
  });

  it("componente não configurável não adiciona preço", () => {
    expect(
      calculateComponentAddonsTotal({
        componentId: "c1",
        slotQuantity: 1,
        node: childNode(0),
        selections: { "grp-extra": [sel("opt-n", "Nutella", 4)] },
        allowConfiguration: false,
      })
    ).toBe(0);
  });

  it("assinatura do carrinho distingue dois slots do mesmo produto", () => {
    const a = buildCartItemSignature({
      productId: "combo-1",
      selectedOptionIds: [],
      observation: "",
      comboComponentKeys: ["slot-a:opt-n", "slot-b:"],
    });
    const b = buildCartItemSignature({
      productId: "combo-1",
      selectedOptionIds: [],
      observation: "",
      comboComponentKeys: ["slot-a:", "slot-b:opt-n"],
    });
    expect(a).not.toBe(b);
  });
});
