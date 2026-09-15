import { supabase } from "@/config/supabase";
import { getDashboardStats } from "@/features/dashboard";
import { fetchOperationCenterRawData } from "@/features/operation-center/repository/operationCenter.repository";
import { buildRealtimeMetrics } from "@/features/operation-center/integrations/kitchen.adapter";
import { buildConnectivityStatus } from "@/features/operation-center/integrations/desktop.adapter";
import { startOfTodayIso } from "@/lib/date";
import { logger } from "@/lib/logger";
import type { CosmoAiAnalysisContext, SaleItemSnapshot } from "../types/analysisContext";

async function fetchSaleItemsToday(): Promise<SaleItemSnapshot[]> {
  const salesResult = await supabase
    .from("sales")
    .select("id, created_at")
    .eq("status", "completed")
    .gte("created_at", startOfTodayIso());

  if (salesResult.error) {
    logger.warn("cosmo-ai sale items:", { message: salesResult.error.message });
    return [];
  }

  const saleIds = (salesResult.data ?? []).map((s) => s.id as string);
  const saleDates = new Map(
    (salesResult.data ?? []).map((s) => [s.id as string, s.created_at as string])
  );

  if (saleIds.length === 0) return [];

  const itemsResult = await supabase
    .from("sale_items")
    .select("id, product_id, product_name, quantity, subtotal, sale_id")
    .in("sale_id", saleIds);

  if (itemsResult.error) return [];

  return (itemsResult.data ?? []).map((item) => ({
    productId: item.product_id as string,
    productName: item.product_name as string,
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    saleId: item.sale_id as string,
    createdAt: saleDates.get(item.sale_id as string) ?? new Date().toISOString(),
  }));
}

async function fetchHistoricalSaleItems(): Promise<SaleItemSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const salesResult = await supabase
    .from("sales")
    .select("id, created_at")
    .eq("status", "completed")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (salesResult.error) return [];

  const saleIds = (salesResult.data ?? []).map((s) => s.id as string);
  const saleDates = new Map(
    (salesResult.data ?? []).map((s) => [s.id as string, s.created_at as string])
  );

  if (saleIds.length === 0) return [];

  const itemsResult = await supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, subtotal, sale_id")
    .in("sale_id", saleIds);

  if (itemsResult.error) return [];

  return (itemsResult.data ?? []).map((item) => ({
    productId: item.product_id as string,
    productName: item.product_name as string,
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
    saleId: item.sale_id as string,
    createdAt: saleDates.get(item.sale_id as string) ?? new Date().toISOString(),
  }));
}

export async function buildAnalysisContext(
  organizationId: string | null
): Promise<CosmoAiAnalysisContext> {
  const [dashboard, operation, saleItemsToday, saleItemsHistory] =
    await Promise.all([
      getDashboardStats(),
      fetchOperationCenterRawData(organizationId),
      fetchSaleItemsToday(),
      fetchHistoricalSaleItems(),
    ]);

  const saleItems = [...saleItemsHistory];
  const seen = new Set(saleItems.map((i) => `${i.saleId}-${i.productId}`));
  for (const item of saleItemsToday) {
    const key = `${item.saleId}-${item.productId}`;
    if (!seen.has(key)) saleItems.push(item);
  }

  const realtime = buildRealtimeMetrics(operation.kitchenTickets);
  const connectivity = buildConnectivityStatus({
    agents: operation.desktopAgents,
    cashSessions: operation.cashSessions,
    realtimeConnected: true,
  });

  return {
    organizationId,
    dashboard,
    operation,
    realtime,
    connectivity,
    saleItems,
    analyzedAt: new Date().toISOString(),
  };
}
