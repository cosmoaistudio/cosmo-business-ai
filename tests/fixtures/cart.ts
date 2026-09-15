import type { Product } from "@/features/products";
import type { CartItem } from "@/features/pdv/types/cart";

export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Hambúrguer",
    price: 20,
    stock: 10,
    status: "active",
    category_id: null,
    description: null,
    image_url: null,
    sku: null,
    cost: 0,
    organization_id: "org-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Product;
}

export function createCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const product = overrides.product ?? createProduct();
  return {
    id: "cart-item-1",
    product,
    quantity: 1,
    unitPrice: Number(product.price),
    selectedOptions: [],
    observation: "",
    ...overrides,
  };
}
