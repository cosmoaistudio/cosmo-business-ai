export * from "./hooks/useInventory";
export * from "./hooks/useStockMovement";

export type {
  StockMovement,
  StockMovementType,
  StockAlert,
  InventoryStats,
} from "./types/inventory";

export {
  computeInventoryStats,
  computeStockAlerts,
} from "./utils/inventoryStats";

export { default as InventoryStatsGrid } from "./components/InventoryStats";
export { default as MovementsTable } from "./components/MovementsTable";
export { default as StockAlertsList } from "./components/StockAlertsList";
export { default as StockMovementDialog } from "./components/StockMovementDialog";
export { default as MinStockDialog } from "./components/MinStockDialog";
