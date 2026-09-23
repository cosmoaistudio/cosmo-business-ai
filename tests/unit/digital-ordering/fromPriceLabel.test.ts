import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";
import {
  formatProductPriceLabel,
  fromPriceLabel,
  productHasPriceVariation,
} from "@/features/digital-ordering/menu/core/fromPriceLabel";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

function product(
  overrides: Partial<DigitalMenuProduct> = {}
): DigitalMenuProduct {
  return {
    id: "p-1",
    name: "Açaí 500ml",
    basePrice: 27,
    available: true,
    menuKind: "simple",
    imageUrl: null,
    categoryName: "Açaí",
    description: null,
    promotionalPrice: null,
    featured: false,
    groups: [],
    ...overrides,
  };
}

const group = {
  id: "g-1",
  name: "Adicionais",
  type: "multiple",
  required: false,
  min: 0,
  max: 5,
  maxFree: 0,
  options: [],
};

describe("productHasPriceVariation", () => {
  it("is false for a simple product without groups", () => {
    expect(productHasPriceVariation(product())).toBe(false);
  });

  it("is true when the product has option groups", () => {
    expect(productHasPriceVariation(product({ groups: [group] }))).toBe(true);
  });

  it("is true for combo catalog items", () => {
    expect(productHasPriceVariation(product({ menuKind: "combo" }))).toBe(true);
    expect(
      productHasPriceVariation(
        product({
          comboSlots: [
            {
              id: "s-1",
              componentProductId: "c-1",
              displayName: "Bebida",
              quantity: 1,
              allowConfiguration: false,
              active: true,
              maxFreeHint: 0,
            },
          ],
        })
      )
    ).toBe(true);
  });
});

describe("fromPriceLabel", () => {
  it("keeps a simple price as-is", () => {
    expect(fromPriceLabel("R$ 27,00", false)).toBe("R$ 27,00");
  });

  it("prefixes only when there is variation evidence", () => {
    expect(fromPriceLabel("R$ 27,00", true)).toBe("A partir de R$ 27,00");
  });

  it("does not change the numeric amount", () => {
    const simple = product({ basePrice: 27 });
    const custom = product({ basePrice: 27, groups: [group] });

    expect(formatProductPriceLabel(simple, 27)).toBe(formatCurrency(27));
    expect(formatProductPriceLabel(custom, 27)).toBe(
      `A partir de ${formatCurrency(27)}`
    );
    expect(simple.basePrice).toBe(27);
    expect(custom.basePrice).toBe(27);
  });
});
