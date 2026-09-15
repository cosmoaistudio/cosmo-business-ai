import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalPlacedOrder } from "../types/digitalOrdering.types";

export interface MobileDigitalOrderSnapshot {
  orderId: string;
  saleNumber: number;
  status: string;
  total: number;
  itemCount: number;
}

export function toMobileOrderSnapshot(order: DigitalPlacedOrder): MobileDigitalOrderSnapshot {
  return {
    orderId: order.id,
    saleNumber: order.saleNumber,
    status: order.status,
    total: order.total,
    itemCount: 0,
  };
}

export function toMobileMenuCards(products: DigitalMenuProduct[]) {
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.basePrice,
    available: product.available,
  }));
}
