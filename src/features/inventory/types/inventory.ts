export type StockMovementType = "entry" | "exit" | "sale" | "adjustment";

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string | null;
  reference_id?: string | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    image_url?: string | null;
    image?: string | null;
  } | null;
}

export interface RegisterStockMovementDTO {
  product_id: string;
  movement_type: "entry" | "exit";
  quantity: number;
  notes?: string;
}

export interface RegisterStockMovementResult {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: "critical" | "warning";
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  movementsToday: number;
}

export const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  entry: "Entrada",
  exit: "Saída",
  sale: "Venda PDV",
  adjustment: "Ajuste",
};
