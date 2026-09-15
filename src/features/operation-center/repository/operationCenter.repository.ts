import { supabase } from "@/config/supabase";
import { getAuditLogs } from "@/core/audit/audit.repository";
import { getProducts } from "@/features/products/repository/products.repository";
import { computeStockAlerts } from "@/features/inventory/utils/inventoryStats";
import { getStockMovements } from "@/features/inventory/repository/inventory.repository";
import { automationRepository } from "@/features/automation/repository/automation.repository";
import type { Product } from "@/features/products/types/product";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type { StockAlert } from "@/features/inventory/types/inventory";
import type { StockMovement } from "@/features/inventory/types/inventory";
import type { AutomationLog } from "@/features/automation/types/automationRule";
import type { AuditRecord } from "@/core/types/audit";
import type { KitchenTicket } from "@/features/kitchen-display/types/kitchenDisplay.types";
import { fetchKitchenTickets } from "@/features/kitchen-display/repository/kitchenDisplay.repository";
import { isToday } from "../utils/periodUtils";

export interface DesktopAgentRow {
  id: string;
  device_name: string;
  status: string;
  last_seen_at: string;
  platform: string | null;
  metadata: Record<string, unknown>;
}

export interface CashSessionRow {
  id: string;
  status: string;
  opened_at: string;
  agent_id: string | null;
}

export interface RemoteCommandRow {
  id: string;
  command: string;
  status: string;
  created_at: string;
  source: string | null;
}

export interface OperationCenterRawData {
  products: Product[];
  options: CompositionOption[];
  stockAlerts: StockAlert[];
  sales: Array<{
    id: string;
    sale_number: number;
    total: number;
    created_at: string;
    customer_id?: string | null;
  }>;
  salesTodayTotal: number;
  salesTodayCount: number;
  movements: StockMovement[];
  automationLogs: AutomationLog[];
  auditLogs: AuditRecord[];
  customers: Array<{ id: string; name: string; created_at: string }>;
  customerIdsWithSales: Set<string>;
  customersWithoutRecentActivity: Array<{ id: string; name: string }>;
  kitchenTickets: KitchenTicket[];
  desktopAgents: DesktopAgentRow[];
  cashSessions: CashSessionRow[];
  remoteCommands: RemoteCommandRow[];
}

async function fetchKitchenTicketsForOrg(
  organizationId: string | null
): Promise<KitchenTicket[]> {
  if (!organizationId) return [];

  try {
    return await fetchKitchenTickets(organizationId);
  } catch (error) {
    console.warn("kitchen_tickets unavailable:", error);
    return [];
  }
}

async function fetchDesktopAgents(organizationId: string | null) {
  if (!organizationId) return [];

  const result = await supabase
    .from("desktop_agents")
    .select("id, device_name, status, last_seen_at, platform, metadata")
    .eq("organization_id", organizationId)
    .order("last_seen_at", { ascending: false });

  if (result.error) {
    console.warn("desktop_agents unavailable:", result.error.message);
    return [];
  }

  return (result.data ?? []) as DesktopAgentRow[];
}

async function fetchCashSessions(organizationId: string | null) {
  if (!organizationId) return [];

  const result = await supabase
    .from("cash_sessions")
    .select("id, status, opened_at, agent_id")
    .eq("organization_id", organizationId)
    .eq("status", "open");

  if (result.error) {
    console.warn("cash_sessions unavailable:", result.error.message);
    return [];
  }

  return (result.data ?? []) as CashSessionRow[];
}

async function fetchRecentRemoteCommands(organizationId: string | null) {
  if (!organizationId) return [];

  const result = await supabase
    .from("remote_commands")
    .select("id, command, status, created_at, source")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (result.error) {
    console.warn("remote_commands unavailable:", result.error.message);
    return [];
  }

  return (result.data ?? []) as RemoteCommandRow[];
}

export async function fetchOperationCenterRawData(
  organizationId?: string | null
): Promise<OperationCenterRawData> {
  const [
    products,
    optionsResult,
    salesResult,
    movements,
    automationLogs,
    auditLogs,
    customersResult,
    kitchenTickets,
    desktopAgents,
    cashSessions,
    remoteCommands,
  ] = await Promise.all([
    getProducts(),
    supabase
      .from("options")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("sales")
      .select("id, sale_number, total, created_at, customer_id, status")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(200),
    getStockMovements(100),
    automationRepository.getAutomationLogs({ limit: 100 }),
    getAuditLogs(100),
    supabase.from("customers").select("id, name, created_at").order("created_at", {
      ascending: false,
    }),
    fetchKitchenTicketsForOrg(organizationId ?? null),
    fetchDesktopAgents(organizationId ?? null),
    fetchCashSessions(organizationId ?? null),
    fetchRecentRemoteCommands(organizationId ?? null),
  ]);

  if (optionsResult.error) throw optionsResult.error;
  if (salesResult.error) throw salesResult.error;
  if (customersResult.error) throw customersResult.error;

  const sales = salesResult.data ?? [];
  const customers = customersResult.data ?? [];
  const options = (optionsResult.data ?? []) as CompositionOption[];

  const customerIdsWithSales = new Set(
    sales
      .map((sale) => sale.customer_id)
      .filter((id): id is string => Boolean(id))
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCustomerIds = new Set(
    sales
      .filter((sale) => new Date(sale.created_at) >= thirtyDaysAgo)
      .map((sale) => sale.customer_id)
      .filter((id): id is string => Boolean(id))
  );

  const customersWithoutRecentActivity = customers.filter(
    (customer) =>
      customerIdsWithSales.has(customer.id) &&
      !recentCustomerIds.has(customer.id)
  );

  const salesToday = sales.filter((sale) => isToday(sale.created_at));
  const salesTodayTotal = salesToday.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  );

  return {
    products,
    options,
    stockAlerts: computeStockAlerts(products),
    sales,
    salesTodayTotal,
    salesTodayCount: salesToday.length,
    movements,
    automationLogs,
    auditLogs,
    customers,
    customerIdsWithSales,
    customersWithoutRecentActivity,
    kitchenTickets,
    desktopAgents,
    cashSessions,
    remoteCommands,
  };
}
