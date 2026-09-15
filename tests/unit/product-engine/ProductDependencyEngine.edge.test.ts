import { describe, expect, it } from "vitest";
import { productDependencyEngine } from "@/features/product-engine/engines/ProductDependencyEngine";

describe("ProductDependencyEngine — edge cases", () => {
  it("grafo vazio não quebra consultas", () => {
    const graph = productDependencyEngine.buildGraph([]);
    expect(graph.products.size).toBe(0);
    expect(productDependencyEngine.getAffectedProductIds(graph, "any")).toEqual([]);
  });

  it("discoverFromOption sem produtos retorna arrays vazios", () => {
    const graph = productDependencyEngine.buildGraph([]);
    const discovery = productDependencyEngine.discoverFromOption(graph, "missing");
    expect(discovery.productIds).toEqual([]);
    expect(discovery.products).toEqual([]);
    expect(discovery.groupId).toBeUndefined();
  });
});
