import { describe, expect, it } from "vitest";
import {
  buildCartItemSignature,
  calculateUnitPrice,
} from "@/features/pdv/utils/compositionPricing";
import { createProduct } from "../../fixtures/cart";

describe("compositionPricing", () => {
  it("retorna preço base sem opções", () => {
    const product = createProduct({ price: 12.5 });
    expect(calculateUnitPrice(product, [])).toBe(12.5);
  });

  it("soma preços das opções", () => {
    const product = createProduct({ price: 10 });
    const total = calculateUnitPrice(product, [
      {
        groupId: "g1",
        groupName: "Extra",
        option: { id: "o1", name: "Queijo", price: 2.5 } as never,
      },
      {
        groupId: "g2",
        groupName: "Molho",
        option: { id: "o2", name: "Barbecue", price: 1.5 } as never,
      },
    ]);
    expect(total).toBe(14);
  });

  it("gera assinatura estável independente da ordem", () => {
    const a = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: ["b", "a"],
      observation: " sem gelo ",
    });
    const b = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: ["a", "b"],
      observation: "sem gelo",
    });
    expect(a).toBe(b);
  });

  it("diferencia observações na assinatura", () => {
    const a = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: [],
      observation: "mesa 1",
    });
    const b = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: [],
      observation: "mesa 2",
    });
    expect(a).not.toBe(b);
  });
});
