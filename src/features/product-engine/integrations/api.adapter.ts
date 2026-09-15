import type { EngineCartPayload, EngineProductNode } from "../types/productEngine.types";

export interface ApiProductEngineResponse {
  product: {
    id: string;
    name: string;
    basePrice: number;
    status: string;
  };
  groups: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    minSelection: number;
    maxSelection: number;
    options: Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      active: boolean;
    }>;
  }>;
}

export function toApiProductResponse(node: EngineProductNode): ApiProductEngineResponse {
  return {
    product: {
      id: node.productId,
      name: node.productName,
      basePrice: node.basePrice,
      status: node.status,
    },
    groups: node.groups.map((group) => ({
      id: group.id,
      name: group.name,
      type: group.type,
      required: group.required,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      options: (node.optionsByGroupId[group.id] ?? []).map((option) => ({
        id: option.id,
        name: option.name,
        price: option.price,
        stock: option.stock,
        active: option.active,
      })),
    })),
  };
}

export function toApiCartPayload(payload: EngineCartPayload) {
  return {
    productId: payload.productId,
    quantity: payload.quantity,
    unitPrice: payload.unitPrice,
    options: payload.selectedOptions,
    observation: payload.observation,
    channel: payload.channel,
  };
}
