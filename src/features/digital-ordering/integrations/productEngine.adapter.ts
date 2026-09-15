import { productEngine } from "@/features/product-engine";
import { toDigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { Product } from "@/features/products/types/product";
import { getProductById } from "@/features/products/repository/products.repository";

export async function loadDigitalMenuCatalog(): Promise<DigitalMenuProduct[]> {
  const nodes = await productEngine.loadCatalog();
  return nodes.map((node) => toDigitalMenuProduct(node));
}

export async function loadDigitalMenuProduct(productId: string) {
  const [node, product] = await Promise.all([
    productEngine.loadProduct(productId),
    getProductById(productId),
  ]);

  return {
    node,
    product: product as Product,
    menuProduct: toDigitalMenuProduct(node),
  };
}
