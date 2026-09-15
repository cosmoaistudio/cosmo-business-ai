import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
  type CreateProductDTO,
} from "../repository/products.repository";
import { emitAutomationEvent } from "@/lib/automation-events";

export const productsService = {
  async getAll() {
    return await getProducts();
  },

  async getById(id: string) {
    return await getProductById(id);
  },

  async create(product: CreateProductDTO) {
    return await createProduct(product);
  },

  async update(
    id: string,
    product: Partial<CreateProductDTO>
  ) {
    const previous =
      product.status !== undefined ? await getProductById(id) : null;

    const updated = await updateProduct(id, product);

    if (previous && product.status && previous.status !== product.status) {
      emitAutomationEvent(
        product.status === "inactive" ? "PRODUCT_PAUSED" : "PRODUCT_ACTIVATED",
        {
          module: "products",
          productId: id,
          productName: updated.name,
          status: updated.status,
          stock: updated.stock,
          entityId: id,
          entityType: "product",
        }
      );
    }

    return updated;
  },

  async remove(id: string) {
    return await deleteProduct(id);
  },
};