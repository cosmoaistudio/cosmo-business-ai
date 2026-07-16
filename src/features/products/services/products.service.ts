import type { Product } from "../types/product";

const mockProducts: Product[] = [];

export const productsService = {
  getAll() {
    return mockProducts;
  },

  create(product: Product) {
    mockProducts.push(product);
  },

  remove(id: string) {
    const index = mockProducts.findIndex((p) => p.id === id);

    if (index >= 0) {
      mockProducts.splice(index, 1);
    }
  },
};