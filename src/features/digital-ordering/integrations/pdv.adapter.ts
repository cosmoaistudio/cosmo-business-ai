import type { CartItem } from "@/features/pdv/types/cart";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import { digitalOrderingService } from "../services/digitalOrdering.service";
import type { DigitalCheckoutInput } from "../types/digitalOrdering.types";

export async function finalizeDigitalOrderViaPdv(input: DigitalCheckoutInput) {
  return digitalOrderingService.placeOrder(input);
}

export function mapDigitalCartToPdvItems(items: CartItem[]) {
  return digitalOrderingService.mapCartToCheckout(items);
}

export function resolveDigitalPaymentMethod(
  method: PaymentMethod,
  payAtCounter: boolean
): PaymentMethod {
  if (payAtCounter && method === "cash") return "cash";
  return method;
}
