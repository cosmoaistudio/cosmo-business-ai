import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { resolveProductPrice } from "../core/menuCatalog";

export type PreviewInspectTarget = "productsheet" | "checkout" | null;

export interface PreviewOrderContext {
  demo: true;
  productName: string;
  quantity: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface PreviewCartSnapshot {
  itemCount: number;
  productIds: string[];
  quantities: number[];
  optionCounts: number[];
  observation: string;
  couponCode: string | null;
}

/**
 * Visual-only checkout numbers for the editor.
 * Never writes to cart, products, or orders.
 */
export function buildPreviewOrderContext(
  products: DigitalMenuProduct[],
  store: { deliveryFee?: number } | null
): PreviewOrderContext {
  const product = products.find((entry) => entry.available !== false) ?? products[0];
  const quantity = 1;
  const unit = product ? resolveProductPrice(product).effectivePrice : 0;
  const subtotal = Number((unit * quantity).toFixed(2));
  const deliveryFee = 0;
  void store;

  return {
    demo: true,
    productName: product?.name ?? "Produto de demonstração",
    quantity,
    subtotal,
    deliveryFee,
    total: subtotal,
  };
}

export function shouldIsolatePreviewMutations(
  previewMode: boolean,
  previewInspect: PreviewInspectTarget | undefined
): boolean {
  return Boolean(previewMode && previewInspect);
}

export function checkoutTotalsForPreview(
  previewInspect: PreviewInspectTarget | undefined,
  previewOrder: PreviewOrderContext,
  cartSummary: { total: number; subtotal: number; deliveryFee: number }
) {
  if (previewInspect === "checkout") {
    return {
      total: previewOrder.total,
      subtotal: previewOrder.subtotal,
      deliveryFee: previewOrder.deliveryFee,
    };
  }
  return cartSummary;
}

export function snapshotPreviewCart(cart: {
  items: Array<{
    product: { id: string };
    quantity: number;
    selectedOptions?: unknown[];
  }>;
  itemCount: number;
  observation: string;
  coupon: { code: string } | null;
}): PreviewCartSnapshot {
  return {
    itemCount: cart.itemCount,
    productIds: cart.items.map((item) => item.product.id),
    quantities: cart.items.map((item) => item.quantity),
    optionCounts: cart.items.map((item) => item.selectedOptions?.length ?? 0),
    observation: cart.observation,
    couponCode: cart.coupon?.code ?? null,
  };
}

export function previewCartUnchanged(
  before: PreviewCartSnapshot,
  after: PreviewCartSnapshot
): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function applyIsolatedCartAction<T>(
  isolated: boolean,
  mutate: () => T,
  fallback: T
): T {
  if (isolated) return fallback;
  return mutate();
}
