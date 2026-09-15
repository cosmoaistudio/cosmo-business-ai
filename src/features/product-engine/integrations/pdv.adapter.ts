import type { CartSelectedOption } from "@/features/pdv/types/cart";
import type { EngineCartPayload } from "../types/productEngine.types";

export function toPdvCartOptions(
  payload: EngineCartPayload,
  groupLookup?: Record<string, { groupId: string; groupName: string }>
): CartSelectedOption[] {
  return payload.selectedOptions.map((option) => ({
    optionId: option.optionId,
    optionName: option.optionName,
    groupId: groupLookup?.[option.optionId]?.groupId ?? "",
    groupName: groupLookup?.[option.optionId]?.groupName ?? "",
    price: option.price,
  }));
}

export interface PdvCartItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: CartSelectedOption[];
  observation: string;
}

export function toPdvCartItem(
  payload: EngineCartPayload,
  productName: string
): PdvCartItemInput {
  return {
    productId: payload.productId,
    productName,
    quantity: payload.quantity,
    unitPrice: payload.unitPrice,
    selectedOptions: toPdvCartOptions(payload),
    observation: payload.observation,
  };
}
