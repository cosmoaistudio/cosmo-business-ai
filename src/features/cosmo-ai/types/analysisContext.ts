import type { DashboardStats } from "@/features/dashboard";
import type { OperationCenterRawData } from "@/features/operation-center/repository/operationCenter.repository";
import type { RealtimeMetrics, ConnectivityStatus } from "@/features/operation-center/types/operationCenter";

export interface SaleItemSnapshot {
  productId: string;
  productName: string;
  quantity: number;
  subtotal: number;
  saleId: string;
  createdAt: string;
}

export interface CosmoAiAnalysisContext {
  organizationId: string | null;
  dashboard: DashboardStats;
  operation: OperationCenterRawData;
  realtime: RealtimeMetrics;
  connectivity: ConnectivityStatus;
  saleItems: SaleItemSnapshot[];
  analyzedAt: string;
}
