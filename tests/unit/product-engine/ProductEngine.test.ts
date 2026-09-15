import { describe, expect, it, vi } from "vitest";
import { ProductEngine } from "@/features/product-engine/core/ProductEngine";
import {
  createCompositeProductNode,
  createInitialBuildState,
  validCompositeSelections,
} from "../../fixtures/productEngine";

vi.mock("@/features/product-engine/repository/productEngine.repository", () => ({
  loadEngineProductNode: vi.fn(),
  loadAllActiveProductNodes: vi.fn(),
  getProductIdsByOptionId: vi.fn(),
}));

vi.mock("@/features/product-engine/core/ProductComposer", () => ({
  productComposer: {
    compose: vi.fn(),
    createInitialBuildState: vi.fn((productId: string) =>
      createInitialBuildState(productId)
    ),
  },
}));

vi.mock("@/features/product-engine/engines/ProductAvailabilityEngine", () => ({
  productAvailabilityEngine: {
    handleOptionStockChange: vi.fn().mockResolvedValue([]),
  },
}));

import {
  loadAllActiveProductNodes,
  loadEngineProductNode,
} from "@/features/product-engine/repository/productEngine.repository";
import { productComposer } from "@/features/product-engine/core/ProductComposer";
import { productAvailabilityEngine } from "@/features/product-engine/engines/ProductAvailabilityEngine";

describe("ProductEngine", () => {
  const engine = new ProductEngine();
  const node = createCompositeProductNode();

  it("expõe sub-engines", () => {
    expect(engine.validator).toBeDefined();
    expect(engine.pricing).toBeDefined();
    expect(engine.dependency).toBeDefined();
    expect(engine.builder).toBeDefined();
  });

  it("loadProduct delega ao repositório", async () => {
    vi.mocked(loadEngineProductNode).mockResolvedValue(node);
    const result = await engine.loadProduct("prod-composite");
    expect(result.productId).toBe("prod-composite");
  });

  it("loadCatalog delega ao repositório", async () => {
    vi.mocked(loadAllActiveProductNodes).mockResolvedValue([node]);
    const catalog = await engine.loadCatalog();
    expect(catalog).toHaveLength(1);
  });

  it("buildDependencyGraph monta grafo do catálogo", async () => {
    vi.mocked(loadAllActiveProductNodes).mockResolvedValue([node]);
    const graph = await engine.buildDependencyGraph();
    expect(graph.products.size).toBe(1);
  });

  it("handleOptionStockChange delega ao availability engine", async () => {
    await engine.handleOptionStockChange("opt-1", 0, 5);
    expect(productAvailabilityEngine.handleOptionStockChange).toHaveBeenCalledWith(
      "opt-1",
      0,
      5
    );
  });

  it("addToCart completa build via builder", async () => {
    vi.mocked(productComposer.compose).mockResolvedValue(node);
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };
    const result = await engine.addToCart(node.productId, state, "pdv");
    expect(result.valid).toBe(true);
    expect(result.cartPayload?.channel).toBe("pdv");
  });
});
