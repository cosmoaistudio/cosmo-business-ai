import { describe, expect, it } from "vitest";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import {
  createCompositeProductNode,
  validCompositeSelections,
} from "../../fixtures/productEngine";

describe("ProductPricingEngine", () => {
  it("calcula preço base para produto simples", () => {
    const node = {
      productId: "p1",
      productName: "Simples",
      basePrice: 10,
      status: "active" as const,
      groups: [],
      optionsByGroupId: {},
    };

    const result = productPricingEngine.calculate(node, {}, 1);
    expect(result.basePrice).toBe(10);
    expect(result.total).toBe(10);
    expect(result.addonsTotal).toBe(0);
  });

  it("soma adicionais e premium", () => {
    const node = createCompositeProductNode();
    const selections = validCompositeSelections();
    selections["grp-premium"] = [
      {
        groupId: "grp-premium",
        groupName: "Premium",
        optionId: "opt-premium-bacon",
        optionName: "Bacon Extra",
        quantity: 1,
        unitPrice: 4,
        premium: true,
      },
    ];

    const result = productPricingEngine.calculate(node, selections, 2);
    expect(result.basePrice).toBe(25);
    expect(result.addonsTotal).toBe(2);
    expect(result.premiumTotal).toBe(4);
    expect(result.subtotal).toBe(62);
    expect(result.total).toBe(62);
  });

  it("aplica descontos de promoções", () => {
    const node = createCompositeProductNode();
    const result = productPricingEngine.calculate(
      node,
      validCompositeSelections(),
      1,
      [{ id: "promo-1", label: "Cupom", amount: 5 }]
    );
    expect(result.discountsTotal).toBe(5);
    expect(result.total).toBe(22);
  });

  it("não retorna total negativo", () => {
    const node = createCompositeProductNode();
    const result = productPricingEngine.calculate(node, {}, 1, [
      { id: "promo-big", label: "Desconto total", amount: 999 },
    ]);
    expect(result.total).toBe(0);
  });

  it("calculateFromBuildState usa seleções do estado", () => {
    const node = createCompositeProductNode();
    const state = {
      productId: node.productId,
      step: "review" as const,
      observation: "",
      selections: validCompositeSelections(),
    };
    const result = productPricingEngine.calculateFromBuildState(node, state);
    expect(result.total).toBe(27);
  });
});
