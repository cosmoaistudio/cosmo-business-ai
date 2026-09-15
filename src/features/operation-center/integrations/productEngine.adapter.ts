import type { Product } from "@/features/products/types/product";

export function countUnavailableProducts(products: Product[]) {
  return products.filter(
    (product) => product.status !== "active" || product.stock <= 0
  ).length;
}

export function countPausedProducts(products: Product[]) {
  return products.filter((product) => product.status === "inactive").length;
}
