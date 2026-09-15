import {
  getProducts,
  updateProduct,
} from "@/features/products/repository/products.repository";
import { emitAutomationEvent } from "@/lib/automation-events";
import {
  getStockMovements,
  registerStockMovement,
} from "../repository/inventory.repository";
import type { RegisterStockMovementDTO } from "../types/inventory";
import {
  computeInventoryStats,
  computeStockAlerts,
} from "../utils/inventoryStats";

export const inventoryService = {
  async getMovements() {
    return await getStockMovements();
  },

  async registerEntry(
    productId: string,
    quantity: number,
    notes?: string
  ) {
    return await inventoryService.registerMovement({
      product_id: productId,
      movement_type: "entry",
      quantity,
      notes,
    });
  },

  async registerExit(
    productId: string,
    quantity: number,
    notes?: string
  ) {
    return await inventoryService.registerMovement({
      product_id: productId,
      movement_type: "exit",
      quantity,
      notes,
    });
  },

  async registerMovement(payload: RegisterStockMovementDTO) {
    const result = await registerStockMovement(payload);

    emitAutomationEvent("STOCK_CHANGED", {
      module: "inventory",
      productId: result.product_id,
      productName: result.product_name,
      stock: result.new_stock,
      previousStock: result.previous_stock,
      movement_type: result.movement_type,
      quantity: result.quantity,
      entityId: result.product_id,
      entityType: "product",
    });

    return result;
  },

  async updateMinStock(productId: string, minStock: number) {
    return await updateProduct(productId, { min_stock: minStock });
  },

  async getAlerts() {
    const products = await getProducts();
    return computeStockAlerts(products);
  },

  async getStats() {
    const [products, movements] = await Promise.all([
      getProducts(),
      getStockMovements(),
    ]);

    return computeInventoryStats(products, movements);
  },

  async getProducts() {
    return await getProducts();
  },
};
