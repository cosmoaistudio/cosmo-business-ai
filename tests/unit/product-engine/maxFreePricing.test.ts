import { describe, expect, it } from "vitest";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import {
  applyMaxFreeAllowance,
  getFreeAllowanceUsage,
} from "@/features/product-engine/utils/maxFreePricing";
import type {
  EngineProductGroup,
  EngineProductNode,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";

function cupGroup(
  overrides: Partial<EngineProductGroup> = {}
): EngineProductGroup {
  return {
    id: "grp-extras",
    name: "Adicionais",
    description: null,
    sortOrder: 0,
    type: "optional",
    selectionType: "checkbox",
    required: false,
    active: true,
    minSelection: 0,
    maxSelection: 10,
    maxFree: 3,
    allowsRepeat: false,
    allowsQuantity: true,
    hidden: false,
    optionIds: ["opt-a", "opt-b", "opt-c", "opt-d"],
    ...overrides,
  };
}

function cupNode(maxFree = 3): EngineProductNode {
  const group = cupGroup({ maxFree });
  return {
    productId: "acai-500",
    productName: "Açaí 500 ml",
    basePrice: 18.9,
    status: "active",
    groups: [group],
    optionsByGroupId: {
      [group.id]: [
        {
          id: "opt-a",
          groupId: group.id,
          name: "Banana",
          description: null,
          imageUrl: null,
          price: 0,
          stock: 10,
          stockControl: false,
          sku: null,
          sortOrder: 0,
          active: true,
          premium: false,
          weight: 0,
        },
        {
          id: "opt-b",
          groupId: group.id,
          name: "Nutella",
          description: null,
          imageUrl: null,
          price: 4,
          stock: 10,
          stockControl: false,
          sku: null,
          sortOrder: 1,
          active: true,
          premium: false,
          weight: 0,
        },
        {
          id: "opt-c",
          groupId: group.id,
          name: "Ovomaltine",
          description: null,
          imageUrl: null,
          price: 3,
          stock: 10,
          stockControl: false,
          sku: null,
          sortOrder: 2,
          active: true,
          premium: false,
          weight: 0,
        },
        {
          id: "opt-d",
          groupId: group.id,
          name: "Creme Ninho",
          description: null,
          imageUrl: null,
          price: 5,
          stock: 10,
          stockControl: false,
          sku: null,
          sortOrder: 3,
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
  unitPrice: number,
  quantity = 1
): EngineSelectionItem {
  return {
    groupId: "grp-extras",
    groupName: "Adicionais",
    optionId,
    optionName,
    quantity,
    unitPrice,
    premium: false,
  };
}

describe("maxFreePricing / copo montado", () => {
  it("preço base sem adicionais", () => {
    const result = productPricingEngine.calculate(cupNode(), {}, 1);
    expect(result.basePrice).toBe(18.9);
    expect(result.total).toBe(18.9);
    expect(result.addonsTotal).toBe(0);
  });

  it("adicionais dentro do max_free ficam grátis (mesmo com preço cadastrado)", () => {
    const selections = {
      "grp-extras": [
        sel("opt-b", "Nutella", 4),
        sel("opt-c", "Ovomaltine", 3),
        sel("opt-d", "Creme Ninho", 5),
      ],
    };
    const result = productPricingEngine.calculate(cupNode(3), selections, 1);
    expect(result.addonsTotal).toBe(0);
    expect(result.total).toBe(18.9);
  });

  it("extras além do max_free são cobrados (mais baratos primeiro ficam grátis)", () => {
    const selections = {
      "grp-extras": [
        sel("opt-b", "Nutella", 4),
        sel("opt-c", "Ovomaltine", 3),
        sel("opt-d", "Creme Ninho", 5),
        sel("opt-a", "Banana", 0),
      ],
    };
    // 4 units, maxFree 3 → cheapest free: Banana(0), Ovo(3), Nutella(4) → charge Ninho(5)
    const result = productPricingEngine.calculate(cupNode(3), selections, 1);
    expect(result.addonsTotal).toBe(5);
    expect(result.total).toBeCloseTo(23.9, 5);
  });

  it("quantidade de opção conta no allowance", () => {
    const lines = applyMaxFreeAllowance(cupGroup({ maxFree: 2 }), [
      sel("opt-b", "Nutella", 4, 3),
    ]);
    expect(lines[0].freeQuantity).toBe(2);
    expect(lines[0].chargedQuantity).toBe(1);
    expect(lines[0].chargedAmount).toBe(4);
  });

  it("usage 5/5", () => {
    const usage = getFreeAllowanceUsage(cupGroup({ maxFree: 5 }), [
      sel("opt-a", "Banana", 0, 2),
      sel("opt-b", "Nutella", 4, 3),
    ]);
    expect(usage.used).toBe(5);
    expect(usage.remaining).toBe(0);
    expect(usage.totalSelected).toBe(5);
  });

  it("qty do item do carrinho não duplica preço unitário no engine (qty=2 no calculate)", () => {
    const selections = {
      "grp-extras": [sel("opt-c", "Ovomaltine", 3)],
    };
    // 1 paid addon (maxFree 0) × cart qty 2
    const result = productPricingEngine.calculate(cupNode(0), selections, 2);
    expect(result.addonsTotal).toBe(3);
    expect(result.subtotal).toBeCloseTo((18.9 + 3) * 2, 5);
  });
});

describe("product menu kind (sem migration)", () => {
  it("deriva simples vs montado vs pausado", async () => {
    const { resolveProductMenuKind } = await import(
      "@/features/products/utils/productMenuKind"
    );
    expect(
      resolveProductMenuKind({ status: "active", compositionGroupCount: 0 })
    ).toBe("simple");
    expect(
      resolveProductMenuKind({ status: "active", compositionGroupCount: 2 })
    ).toBe("assembled");
    expect(
      resolveProductMenuKind({ status: "inactive", compositionGroupCount: 2 })
    ).toBe("paused");
  });
});
