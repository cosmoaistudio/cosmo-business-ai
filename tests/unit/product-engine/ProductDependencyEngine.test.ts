import { describe, expect, it } from "vitest";
import { productDependencyEngine } from "@/features/product-engine/engines/ProductDependencyEngine";
import {
  createCompositeProductNode,
  createSimpleProductNode,
  OPTION_SIZE_M,
} from "../../fixtures/productEngine";

describe("ProductDependencyEngine", () => {
  it("constrói grafo com produtos, grupos e opções", () => {
    const nodes = [createCompositeProductNode(), createSimpleProductNode()];
    const graph = productDependencyEngine.buildGraph(nodes);

    expect(graph.products.size).toBe(2);
    expect(graph.optionToProducts.get(OPTION_SIZE_M)?.has("prod-composite")).toBe(true);
    expect(graph.optionToGroups.get(OPTION_SIZE_M)).toBe("grp-size");
  });

  it("retorna produtos afetados por opção", () => {
    const graph = productDependencyEngine.buildGraph([createCompositeProductNode()]);
    const affected = productDependencyEngine.getAffectedProductIds(graph, OPTION_SIZE_M);
    expect(affected).toEqual(["prod-composite"]);
  });

  it("descobre hierarquia a partir de opção", () => {
    const node = createCompositeProductNode();
    const graph = productDependencyEngine.buildGraph([node]);
    const discovery = productDependencyEngine.discoverFromOption(graph, OPTION_SIZE_M);

    expect(discovery.optionId).toBe(OPTION_SIZE_M);
    expect(discovery.groupId).toBe("grp-size");
    expect(discovery.productIds).toContain("prod-composite");
    expect(discovery.products[0]?.productName).toBe("Combo Especial");
  });

  it("retorna hierarquia legível do produto", () => {
    const hierarchy = productDependencyEngine.getProductHierarchy(
      createCompositeProductNode()
    );
    expect(hierarchy.product.name).toBe("Combo Especial");
    expect(hierarchy.groups.length).toBe(3);
    expect(hierarchy.groups[0]?.options.length).toBeGreaterThan(0);
  });
});
