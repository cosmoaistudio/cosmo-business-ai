import { updateOption } from "@/features/product-composition/repository/options.repository";
import { productsService } from "@/features/products/services/products.service";
import { productDependencyEngine } from "./ProductDependencyEngine";
import {
  getProductIdsByOptionId,
  loadAllActiveProductNodes,
  loadEngineProductNode,
} from "../repository/productEngine.repository";
import type {
  EngineAvailabilityAction,
  EngineProductNode,
} from "../types/productEngine.types";

function isOptionAvailable(option: {
  active: boolean;
  stockControl: boolean;
  stock: number;
}) {
  if (!option.active) return false;
  if (option.stockControl && option.stock <= 0) return false;
  return true;
}

function canProductBeActive(node: EngineProductNode) {
  for (const group of node.groups) {
    if (!group.required) continue;
    const options = node.optionsByGroupId[group.id] ?? [];
    const hasAvailable = options.some(isOptionAvailable);
    if (!hasAvailable) return false;
  }
  return true;
}

export class ProductAvailabilityEngine {
  async syncOptionStockImpact(optionId: string, previousStock?: number) {
    const productIds = await getProductIdsByOptionId(optionId);
    const actions: EngineAvailabilityAction[] = [];

    const nodes = await Promise.all(
      productIds.map((productId) => loadEngineProductNode(productId))
    );

    const graph = productDependencyEngine.buildGraph(nodes);
    const discovery = productDependencyEngine.discoverFromOption(graph, optionId);

    for (const node of discovery.products) {
      const shouldPause = !canProductBeActive(node);
      if (shouldPause && node.status === "active") {
        await productsService.update(node.productId, { status: "inactive" });
        actions.push({
          optionId,
          productId: node.productId,
          action: "pause",
          reason: "Opção sem estoque afetou grupo obrigatório",
        });
      }

      if (!shouldPause && node.status === "inactive") {
        await productsService.update(node.productId, { status: "active" });
        actions.push({
          optionId,
          productId: node.productId,
          action: "activate",
          reason: "Estoque restaurado — produto reativado",
        });
      }
    }

    if (previousStock !== undefined && previousStock > 0) {
      return actions;
    }

    return actions;
  }

  async handleOptionStockChange(optionId: string, newStock: number, previousStock?: number) {
    const shouldPauseOption = newStock <= 0;

    if (shouldPauseOption) {
      await updateOption(optionId, { active: false, stock: 0 });
    } else if (previousStock !== undefined && previousStock <= 0 && newStock > 0) {
      await updateOption(optionId, { active: true, stock: newStock });
    } else {
      await updateOption(optionId, { stock: newStock });
    }

    return this.syncOptionStockImpact(optionId, previousStock);
  }

  async rebuildAvailabilityIndex(limit = 200) {
    const nodes = await loadAllActiveProductNodes(limit);
    const graph = productDependencyEngine.buildGraph(nodes);
    const actions: EngineAvailabilityAction[] = [];

    for (const [optionId] of graph.optionToProducts) {
      const impacted = await this.syncOptionStockImpact(optionId);
      actions.push(...impacted);
    }

    return actions;
  }
}

export const productAvailabilityEngine = new ProductAvailabilityEngine();
