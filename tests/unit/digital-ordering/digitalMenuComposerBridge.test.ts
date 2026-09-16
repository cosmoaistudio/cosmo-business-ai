import { describe, expect, it } from "vitest";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import {
  composerInputFromDigitalMenuProduct,
  engineNodeFromDigitalMenuProduct,
  productFromDigitalMenuProduct,
} from "@/features/digital-ordering/utils/digitalMenuComposerBridge";
import { resolveDigitalMenuBasePrice } from "@/features/products/utils/productDigitalPromo";

function menuProduct(
  overrides: Partial<DigitalMenuProduct> = {}
): DigitalMenuProduct {
  return {
    id: "p-1",
    name: "Açaí 500ml",
    basePrice: 20,
    available: true,
    menuKind: "assembled",
    imageUrl: "https://cdn.example/acai.webp",
    categoryName: "Açaí",
    description: "Cremoso",
    promotionalPrice: 15,
    featured: true,
    groups: [
      {
        id: "grp-1",
        name: "Adicionais",
        type: "optional",
        required: false,
        min: 0,
        max: 3,
        maxFree: 1,
        options: [
          {
            id: "opt-1",
            name: "Morango",
            price: 3,
            imageUrl: null,
            available: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("digitalMenuComposerBridge", () => {
  it("builds a Product from the public snapshot without auth fields", () => {
    const product = productFromDigitalMenuProduct(menuProduct());

    expect(product.id).toBe("p-1");
    expect(product.price).toBe(20);
    expect(product.promotionalPrice).toBe(15);
    expect(product.featured).toBe(true);
    expect(product.menu_kind).toBe("assembled");
    expect(product.image_url).toContain("acai.webp");
    expect(resolveDigitalMenuBasePrice(product.price, product.promotionalPrice)).toBe(15);
  });

  it("builds an EngineProductNode with groups and options for the composer", () => {
    const node = engineNodeFromDigitalMenuProduct(menuProduct());

    expect(node.productId).toBe("p-1");
    expect(node.basePrice).toBe(20);
    expect(node.groups).toHaveLength(1);
    expect(node.groups[0].maxFree).toBe(1);
    expect(node.optionsByGroupId["grp-1"]).toHaveLength(1);
    expect(node.optionsByGroupId["grp-1"][0].price).toBe(3);
  });

  it("composerInput returns product + node ready for preloadedNode", () => {
    const input = composerInputFromDigitalMenuProduct(
      menuProduct({ menuKind: "simple", groups: [], promotionalPrice: null })
    );

    expect(input.product.menu_kind).toBe("simple");
    expect(input.node.groups).toEqual([]);
    expect(input.node.productId).toBe(input.product.id);
  });
});
