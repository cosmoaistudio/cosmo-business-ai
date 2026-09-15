import type { Product } from "../types/product";

export function filterProductsByQuery(
  products: Product[],
  query: string
): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products;

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      (product.category?.toLowerCase().includes(normalized) ?? false)
  );
}
