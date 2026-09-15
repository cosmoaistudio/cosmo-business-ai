import { productComposer } from "./ProductComposer";
import {
  buildBuilderCartPayload,
  removeBuilderOption,
  selectBuilderOption,
  type ProductBuilderResult,
} from "./productBuilderCore";
import type {
  EngineBuildState,
  EngineChannel,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";

export type { ProductBuilderResult };

export class ProductBuilder {
  async start(productId: string) {
    const node = await productComposer.compose(productId);
    const state = productComposer.createInitialBuildState(productId);
    return { node, state };
  }

  selectOption(
    node: EngineProductNode,
    state: EngineBuildState,
    groupId: string,
    option: EngineSelectionItem
  ): EngineBuildState {
    return selectBuilderOption(node, state, groupId, option);
  }

  removeOption(
    state: EngineBuildState,
    groupId: string,
    optionId: string
  ): EngineBuildState {
    return removeBuilderOption(state, groupId, optionId);
  }

  buildCartPayload(
    node: EngineProductNode,
    state: EngineBuildState,
    channel: EngineChannel,
    quantity = 1
  ): ProductBuilderResult {
    return buildBuilderCartPayload(node, state, channel, quantity);
  }

  async complete(
    productId: string,
    state: EngineBuildState,
    channel: EngineChannel,
    quantity = 1
  ) {
    const node = await productComposer.compose(productId);
    return this.buildCartPayload(node, state, channel, quantity);
  }
}

export const productBuilder = new ProductBuilder();
