import { describe, expect, it } from "vitest";
import { productRulesEngine } from "@/features/product-engine/engines/ProductRulesEngine";
import {
  createCompositeProductNode,
  PREMIUM_GROUP_ID,
  validCompositeSelections,
  selection,
} from "../../fixtures/productEngine";

describe("ProductRulesEngine", () => {
  it("valida quando premium sem tamanho selecionado", () => {
    const node = createCompositeProductNode();
    const selections = {
      [PREMIUM_GROUP_ID]: [
        selection({
          groupId: PREMIUM_GROUP_ID,
          groupName: "Premium",
          optionId: "opt-premium-bacon",
          optionName: "Bacon Extra",
          unitPrice: 4,
          premium: true,
        }),
      ],
    };

    const result = productRulesEngine.evaluate(node, selections);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("tamanho");
  });

  it("passa quando tamanho selecionado antes do premium", () => {
    const node = createCompositeProductNode();
    const selections = {
      ...validCompositeSelections(),
      [PREMIUM_GROUP_ID]: [
        selection({
          groupId: PREMIUM_GROUP_ID,
          groupName: "Premium",
          optionId: "opt-premium-bacon",
          optionName: "Bacon Extra",
          unitPrice: 4,
          premium: true,
        }),
      ],
    };

    expect(productRulesEngine.evaluate(node, selections).valid).toBe(true);
  });

  it("limita brindes ao maxFree", () => {
    const node = createCompositeProductNode({
      groups: createCompositeProductNode().groups.map((g) =>
        g.type === "gift" ? { ...g, type: "gift" as const, maxFree: 1 } : g
      ),
    });

    const giftGroup = node.groups.find((g) => g.type === "gift");
    if (!giftGroup) {
      const groups = createCompositeProductNode().groups;
      node.groups = [
        ...groups,
        {
          ...groups[1],
          id: "grp-gift",
          name: "Brinde",
          type: "gift",
          maxFree: 1,
          optionIds: ["opt-gift-1", "opt-gift-2"],
        },
      ];
      node.optionsByGroupId["grp-gift"] = [
        {
          id: "opt-gift-1",
          groupId: "grp-gift",
          name: "Brinde A",
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
          id: "opt-gift-2",
          groupId: "grp-gift",
          name: "Brinde B",
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
      ];
    }

    const giftId = node.groups.find((g) => g.type === "gift")!.id;
    const options = node.optionsByGroupId[giftId] ?? [];

    const result = productRulesEngine.evaluate(node, {
      [giftId]: options.map((opt) =>
        selection({
          groupId: giftId,
          groupName: "Brinde",
          optionId: opt.id,
          optionName: opt.name,
        })
      ),
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Brindes"))).toBe(true);
  });

  it("detecta conflito de ingredientes", () => {
    const node = createCompositeProductNode({
      groups: [
        ...createCompositeProductNode().groups,
        {
          id: "grp-ing",
          name: "Ingredientes",
          description: null,
          sortOrder: 99,
          type: "ingredient",
          selectionType: "checkbox",
          required: false,
          active: true,
          minSelection: 0,
          maxSelection: 3,
          maxFree: 0,
          allowsRepeat: false,
          allowsQuantity: false,
          hidden: false,
          optionIds: ["opt-no-onion", "opt-extra-onion"],
        },
      ],
      optionsByGroupId: {
        ...createCompositeProductNode().optionsByGroupId,
        "grp-ing": [
          {
            id: "opt-no-onion",
            groupId: "grp-ing",
            name: "Sem cebola",
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
            id: "opt-extra-onion",
            groupId: "grp-ing",
            name: "Extra cebola",
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
        ],
      },
    });

    const result = productRulesEngine.evaluate(node, {
      "grp-ing": [
        selection({
          groupId: "grp-ing",
          groupName: "Ingredientes",
          optionId: "opt-no-onion",
          optionName: "Sem cebola",
        }),
        selection({
          groupId: "grp-ing",
          groupName: "Ingredientes",
          optionId: "opt-extra-onion",
          optionName: "Extra cebola",
        }),
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("cebola"))).toBe(true);
  });
});
