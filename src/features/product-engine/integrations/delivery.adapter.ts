import type { EngineCartPayload, EngineProductNode } from "../types/productEngine.types";

export interface DeliveryOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: Array<{ name: string; price: number; quantity: number }>;
  notes: string;
}

export function toDeliveryOrderItem(
  node: EngineProductNode,
  payload: EngineCartPayload
): DeliveryOrderItem {
  return {
    productId: payload.productId,
    name: node.productName,
    quantity: payload.quantity,
    unitPrice: payload.unitPrice,
    modifiers: payload.selectedOptions.map((option) => ({
      name: option.optionName,
      price: option.price,
      quantity: option.quantity,
    })),
    notes: payload.observation,
  };
}
