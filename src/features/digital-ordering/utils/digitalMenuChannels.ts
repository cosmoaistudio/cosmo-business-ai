import type { DigitalOrderMode } from "../types/digitalStore.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

export type DigitalMenuChannel = "delivery" | "pickup" | "dine_in";

export interface DigitalProductChannelFlags {
  delivery: boolean;
  pickup: boolean;
  dine_in: boolean;
}

export interface DigitalProductChannelSort {
  delivery: number;
  pickup: number;
  dine_in: number;
}

export const DEFAULT_CHANNEL_FLAGS: DigitalProductChannelFlags = {
  delivery: true,
  pickup: true,
  dine_in: true,
};

export const DEFAULT_CHANNEL_SORT: DigitalProductChannelSort = {
  delivery: 0,
  pickup: 0,
  dine_in: 0,
};

export function toMenuChannel(
  mode: DigitalOrderMode | string | null | undefined
): DigitalMenuChannel | null {
  const normalized = String(mode ?? "").trim().toLowerCase();
  if (
    normalized === "delivery" ||
    normalized === "pickup" ||
    normalized === "dine_in"
  ) {
    return normalized;
  }
  return null;
}

export function isProductVisibleOnChannel(
  product: Pick<DigitalMenuProduct, "available" | "channels">,
  channel: DigitalMenuChannel
): boolean {
  if (product.available === false) return false;
  const flags = product.channels ?? DEFAULT_CHANNEL_FLAGS;
  return flags[channel] !== false;
}

export function sortProductsForChannel(
  products: DigitalMenuProduct[],
  channel: DigitalMenuChannel
): DigitalMenuProduct[] {
  return [...products].sort((a, b) => {
    const aOrder = a.channelSort?.[channel] ?? 0;
    const bOrder = b.channelSort?.[channel] ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function filterCatalogForChannel(
  products: DigitalMenuProduct[],
  mode: DigitalOrderMode | string | null | undefined
): DigitalMenuProduct[] {
  const channel = toMenuChannel(mode);
  if (!channel) {
    // event/unknown: show available products without channel filter
    return products.filter((product) => product.available !== false);
  }
  return sortProductsForChannel(
    products.filter((product) => isProductVisibleOnChannel(product, channel)),
    channel
  );
}

export function cartItemsMissingOnChannel(
  productIds: string[],
  catalog: DigitalMenuProduct[],
  mode: DigitalOrderMode | string | null | undefined
): string[] {
  const channel = toMenuChannel(mode);
  if (!channel) return [];
  const byId = new Map(catalog.map((product) => [product.id, product]));
  return productIds.filter((id) => {
    const product = byId.get(id);
    if (!product) return true;
    return !isProductVisibleOnChannel(product, channel);
  });
}
