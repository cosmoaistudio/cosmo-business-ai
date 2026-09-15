import { productAvailabilityEngine } from "../engines/ProductAvailabilityEngine";
import { productDependencyEngine } from "../engines/ProductDependencyEngine";
import { productPricingEngine } from "../engines/ProductPricingEngine";
import { productRulesEngine } from "../engines/ProductRulesEngine";
import { productValidator } from "../engines/ProductValidator";
import { productBuilder } from "./ProductBuilder";
import { productComposer } from "./ProductComposer";
import { productSummary } from "./ProductSummary";
import {
  loadAllActiveProductNodes,
  loadEngineProductNode,
} from "../repository/productEngine.repository";
import type { EngineChannel } from "../types/productEngine.types";

export class ProductEngine {
  readonly composer = productComposer;
  readonly builder = productBuilder;
  readonly validator = productValidator;
  readonly pricing = productPricingEngine;
  readonly rules = productRulesEngine;
  readonly dependency = productDependencyEngine;
  readonly availability = productAvailabilityEngine;
  readonly summary = productSummary;

  async loadProduct(productId: string) {
    return loadEngineProductNode(productId);
  }

  async loadCatalog(limit = 200) {
    return loadAllActiveProductNodes(limit);
  }

  async buildDependencyGraph(limit = 200) {
    const nodes = await loadAllActiveProductNodes(limit);
    return productDependencyEngine.buildGraph(nodes);
  }

  async handleOptionStockChange(optionId: string, newStock: number, previousStock?: number) {
    return productAvailabilityEngine.handleOptionStockChange(
      optionId,
      newStock,
      previousStock
    );
  }

  async addToCart(
    productId: string,
    state: Parameters<typeof productBuilder.complete>[1],
    channel: EngineChannel = "pdv",
    quantity = 1
  ) {
    return productBuilder.complete(productId, state, channel, quantity);
  }
}

export const productEngine = new ProductEngine();
