import type { Product } from "@/features/products";
import type { InventoryStats, StockAlert, StockMovement } from "../types/inventory";

export function computeStockAlerts(products: Product[]): StockAlert[] {
  return products
    .filter((product) => product.min_stock > 0 && product.stock <= product.min_stock)
    .map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      minStock: product.min_stock,
      severity: (product.stock === 0 ? "critical" : "warning") as StockAlert["severity"],
    }))
    .sort((a, b) => a.currentStock - b.currentStock);
}

export function computeInventoryStats(
  products: Product[],
  movements: StockMovement[]
): InventoryStats {
  const today = new Date();

  const movementsToday = movements.filter((movement) => {
    const date = new Date(movement.created_at);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;

  const alerts = computeStockAlerts(products);

  return {
    totalProducts: products.length,
    totalUnits: products.reduce((sum, product) => sum + product.stock, 0),
    lowStockCount: alerts.length,
    outOfStockCount: products.filter((product) => product.stock === 0).length,
    movementsToday,
  };
}
