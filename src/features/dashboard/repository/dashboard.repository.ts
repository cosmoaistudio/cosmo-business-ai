import { supabase } from "@/config/supabase";
import { getProducts } from "@/features/products/repository/products.repository";
import { computeStockAlerts } from "@/features/inventory/utils/inventoryStats";
import { isToday } from "@/lib/date";
import type { DashboardStats } from "../types/dashboard";
import { buildDashboardMetrics } from "../utils/dashboardAggregations";

export type { DashboardStats } from "../types/dashboard";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    salesResult,
    saleItemsResult,
    saleItemOptionsResult,
    customersResult,
    customersDataResult,
    financeResult,
    products,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, sale_number, customer_id, total, created_at")
      .eq("status", "completed"),
    supabase
      .from("sale_items")
      .select("id, product_id, product_name, quantity, subtotal, sale_id"),
    supabase
      .from("sale_item_options")
      .select(
        `
        option_id,
        option_name,
        quantity,
        subtotal,
        sale_items!inner (
          sale_id
        )
      `
      ),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true }),
    supabase.from("customers").select("id, name, created_at"),
    supabase
      .from("financial_transactions")
      .select("*")
      .order("transaction_date", { ascending: false }),
    getProducts(),
  ]);

  if (salesResult.error) throw salesResult.error;
  if (saleItemsResult.error) throw saleItemsResult.error;
  if (saleItemOptionsResult.error) throw saleItemOptionsResult.error;
  if (customersResult.error) throw customersResult.error;
  if (customersDataResult.error) throw customersDataResult.error;
  if (financeResult.error) throw financeResult.error;

  const sales = salesResult.data ?? [];
  const completedSaleIds = new Set(sales.map((sale) => sale.id));

  const saleItems = (saleItemsResult.data ?? [])
    .filter((item) => completedSaleIds.has(item.sale_id))
    .map((item) => ({
      sale_id: item.sale_id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

  const saleItemOptions = (saleItemOptionsResult.data ?? [])
    .map((row) => {
      const saleItem = Array.isArray(row.sale_items)
        ? row.sale_items[0]
        : row.sale_items;

      return {
        sale_id: saleItem?.sale_id as string | undefined,
        option_id: row.option_id as string,
        option_name: row.option_name as string,
        quantity: row.quantity as number,
        subtotal: row.subtotal as number,
      };
    })
    .filter(
      (item): item is {
        sale_id: string;
        option_id: string;
        option_name: string;
        quantity: number;
        subtotal: number;
      } => Boolean(item.sale_id && completedSaleIds.has(item.sale_id))
    );

  const newCustomersToday = (customersDataResult.data ?? []).filter(
    (customer) => isToday(customer.created_at)
  ).length;

  const customerNames = new Map(
    (customersDataResult.data ?? []).map((customer) => [
      customer.id,
      customer.name,
    ])
  );

  const stockAlerts = computeStockAlerts(products);

  return buildDashboardMetrics({
    sales,
    products,
    stockAlerts,
    totalCustomers: customersResult.count ?? 0,
    newCustomersToday,
    saleItems,
    saleItemOptions,
    financialTransactions: financeResult.data ?? [],
    customerNames,
  });
}
