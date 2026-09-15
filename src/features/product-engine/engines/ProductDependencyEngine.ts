import type {
  EngineDependencyGraph,
  EngineProductNode,
} from "../types/productEngine.types";

export class ProductDependencyEngine {
  buildGraph(nodes: EngineProductNode[]): EngineDependencyGraph {
    const products = new Map<string, EngineProductNode>();
    const groupToProducts = new Map<string, Set<string>>();
    const optionToProducts = new Map<string, Set<string>>();
    const optionToGroups = new Map<string, string>();

    for (const node of nodes) {
      products.set(node.productId, node);

      for (const group of node.groups) {
        if (!groupToProducts.has(group.id)) {
          groupToProducts.set(group.id, new Set());
        }
        groupToProducts.get(group.id)!.add(node.productId);

        const options = node.optionsByGroupId[group.id] ?? [];
        for (const option of options) {
          optionToGroups.set(option.id, group.id);
          if (!optionToProducts.has(option.id)) {
            optionToProducts.set(option.id, new Set());
          }
          optionToProducts.get(option.id)!.add(node.productId);
        }
      }
    }

    return { products, groupToProducts, optionToProducts, optionToGroups };
  }

  getAffectedProductIds(graph: EngineDependencyGraph, optionId: string) {
    return [...(graph.optionToProducts.get(optionId) ?? new Set<string>())];
  }

  getProductHierarchy(node: EngineProductNode) {
    return {
      product: {
        id: node.productId,
        name: node.productName,
      },
      groups: node.groups.map((group) => ({
        id: group.id,
        name: group.name,
        type: group.type,
        options: (node.optionsByGroupId[group.id] ?? []).map((option) => ({
          id: option.id,
          name: option.name,
          stock: option.stock,
          stockControl: option.stockControl,
          ingredients: option.groupId === group.id ? [] : [],
        })),
      })),
    };
  }

  discoverFromOption(
    graph: EngineDependencyGraph,
    optionId: string
  ): {
    optionId: string;
    groupId: string | undefined;
    productIds: string[];
    products: EngineProductNode[];
  } {
    const productIds = this.getAffectedProductIds(graph, optionId);
    const groupId = graph.optionToGroups.get(optionId);

    return {
      optionId,
      groupId,
      productIds,
      products: productIds
        .map((id) => graph.products.get(id))
        .filter((entry): entry is EngineProductNode => Boolean(entry)),
    };
  }
}

export const productDependencyEngine = new ProductDependencyEngine();
