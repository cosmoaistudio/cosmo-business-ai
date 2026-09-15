import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { buildCartItemSignature, calculateUnitPrice } from "@/features/pdv/utils/compositionPricing";
import { createCartItem, createProduct } from "../../fixtures/cart";

describe("PDV — Carrinho (integração lógica)", () => {
  it("calcula preço unitário com opções", () => {
    const product = createProduct({ price: 20 });
    const price = calculateUnitPrice(product, [
      {
        groupId: "g1",
        groupName: "Molho",
        option: {
          id: "o1",
          name: "Cheddar",
          price: 3,
          group_id: "g1",
        } as never,
      },
    ]);
    expect(price).toBe(23);
  });

  it("deduplica itens pela assinatura", () => {
    const sig1 = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: ["o1", "o2"],
      observation: "",
    });
    const sig2 = buildCartItemSignature({
      productId: "p1",
      selectedOptionIds: ["o2", "o1"],
      observation: "",
    });
    expect(sig1).toBe(sig2);
  });

  it("simula carrinho com múltiplos itens", () => {
    const items = [
      createCartItem({ quantity: 2, unitPrice: 25 }),
      createCartItem({ id: "cart-2", quantity: 1, unitPrice: 10 }),
    ];
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    expect(subtotal).toBe(60);
  });
});

describe("PDV — useCart comportamento", () => {
  it("não adiciona produto inativo", async () => {
    const { useCart } = await import("@/features/pdv/hooks/useCart");
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addProduct(createProduct({ status: "inactive" }));
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("não adiciona produto sem estoque", async () => {
    const { useCart } = await import("@/features/pdv/hooks/useCart");
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addProduct(createProduct({ stock: 0 }));
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("adiciona produto simples e calcula total", async () => {
    const { useCart } = await import("@/features/pdv/hooks/useCart");
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addProduct(createProduct({ price: 15 }));
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.summary.total).toBe(15);
  });
});
