import type { KitchenStatus } from "@/features/kitchen-display/types/kitchenDisplay.types";
import { mapKitchenStatusToDigital } from "../utils/orderTimeline";
import type { DigitalOrderStatusStep } from "../types/digitalOrdering.types";

export function mapKitchenTicketToOrderStatus(
  status: KitchenStatus | string
): DigitalOrderStatusStep {
  return mapKitchenStatusToDigital(status);
}

export function buildKitchenObservationPrefix(mode: string, tableLabel?: string) {
  if (mode === "dine_in" && tableLabel) {
    return `mesa ${tableLabel}`;
  }
  if (mode === "delivery") return "delivery entrega";
  if (mode === "pickup") return "retirada balcão pickup";
  return "pedido digital counter";
}
