import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import type { Product } from "@/features/products";
import { inventoryService } from "../services/inventory.service";
import type {
  InventoryStats,
  StockAlert,
  StockMovement,
} from "../types/inventory";

const EMPTY_STATS: InventoryStats = {
  totalProducts: 0,
  totalUnits: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  movementsToday: 0,
};

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [stats, setStats] = useState<InventoryStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);

      const [productsData, movementsData, alertsData, statsData] =
        await Promise.all([
          inventoryService.getProducts(),
          inventoryService.getMovements(),
          inventoryService.getAlerts(),
          inventoryService.getStats(),
        ]);

      setProducts(productsData);
      setMovements(movementsData);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      logger.error("Erro ao carregar estoque:", error);
      toast.error("Não foi possível carregar o estoque. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return onDataChanged(reload);
  }, [reload]);

  return {
    products,
    movements,
    alerts,
    stats,
    loading,
    reload,
  };
}
