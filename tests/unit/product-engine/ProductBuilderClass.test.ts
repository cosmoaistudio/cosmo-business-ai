import { describe, expect, it, vi } from "vitest";
import { ProductBuilder } from "@/features/product-engine/core/ProductBuilder";
import {
  createCompositeProductNode,
  createInitialBuildState,
  OPTION_SIZE_M,
  SIZE_GROUP_ID,
  validCompositeSelections,
  selection,
} from "../../fixtures/productEngine";

vi.mock("@/features/product-engine/core/ProductComposer", () => ({
  productComposer: {
    compose: vi.fn(),
    createInitialBuildState: vi.fn((productId: string) =>
      createInitialBuildState(productId)
    ),
  },
}));

import { productComposer } from "@/features/product-engine/core/ProductComposer";

describe("ProductBuilder (class)", () => {
  const builder = new ProductBuilder();
  const node = createCompositeProductNode();

  it("start compõe produto e retorna estado inicial", async () => {
    vi.mocked(productComposer.compose).mockResolvedValue(node);
    const result = await builder.start(node.productId);
    expect(result.node.productId).toBe("prod-composite");
    expect(result.state.productId).toBe("prod-composite");
  });

  it("selectOption delega ao core", () => {
    const state = createInitialBuildState(node.productId);
    const next = builder.selectOption(
      node,
      state,
      SIZE_GROUP_ID,
      selection({
        groupId: SIZE_GROUP_ID,
        groupName: "Tamanho",
        optionId: OPTION_SIZE_M,
        optionName: "Médio",
      })
    );
    expect(next.selections[SIZE_GROUP_ID]).toHaveLength(1);
  });

  it("removeOption delega ao core", () => {
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };
    const next = builder.removeOption(state, SIZE_GROUP_ID, OPTION_SIZE_M);
    expect(next.selections[SIZE_GROUP_ID]).toHaveLength(0);
  });

  it("complete compõe e gera payload", async () => {
    vi.mocked(productComposer.compose).mockResolvedValue(node);
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };
    const result = await builder.complete(node.productId, state, "pdv");
    expect(result.valid).toBe(true);
    expect(result.cartPayload?.channel).toBe("pdv");
  });
});
