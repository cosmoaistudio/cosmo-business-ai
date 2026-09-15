import type { EngineCartPayload, EngineProductNode } from "../types/productEngine.types";
import { toDigitalMenuProduct } from "./digitalMenu.adapter";

export interface MobileProductCard {
  id: string;
  title: string;
  price: number;
  status: "active" | "inactive";
  groupCount: number;
}

export function toMobileProductCard(node: EngineProductNode): MobileProductCard {
  return {
    id: node.productId,
    title: node.productName,
    price: node.basePrice,
    status: node.status,
    groupCount: node.groups.length,
  };
}

export function toMobileCartPayload(payload: EngineCartPayload) {
  return {
    ...payload,
    menuProduct: undefined as ReturnType<typeof toDigitalMenuProduct> | undefined,
  };
}
