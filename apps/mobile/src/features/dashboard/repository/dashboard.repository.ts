import { supabase } from "@/lib/supabase";
import type { DesktopAgentRecord } from "@cosmo/remote-commands";
import type {
  DashboardOptionRow,
  DashboardProductRow,
  DashboardRawData,
  DashboardRemoteCommandRow,
  DashboardSaleRow,
} from "../types/dashboard.types";
import { startOfTodayIso } from "../utils/dashboard.utils";

function assertNoError<T>(result: { data: T | null; error: unknown }, table: string) {
  if (result.error) {
    const message =
      typeof result.error === "object" &&
      result.error &&
      "message" in result.error
        ? String((result.error as { message: unknown }).message)
        : String(result.error);

    throw new Error(`[${table}] ${message}`);
  }
}

export async function fetchDashboardRawData(
  organizationId: string
): Promise<DashboardRawData> {
  const todayIso = startOfTodayIso();

  const [
    salesTodayResult,
    recentSalesResult,
    productsResult,
    optionsResult,
    pendingCommandsResult,
    automationLogsResult,
    desktopAgentsResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, sale_number, total, created_at, status")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("created_at", todayIso),
    supabase
      .from("sales")
      .select("id, sale_number, total, created_at, status")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("products")
      .select("id, name, stock, min_stock, status")
      .eq("organization_id", organizationId),
    supabase
      .from("options")
      .select("id, name, active, group_id, stock, stock_control")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("remote_commands")
      .select("id, status, created_at, command")
      .eq("organization_id", organizationId)
      .in("status", ["pending", "processing"]),
    supabase
      .from("automation_logs")
      .select("id, status, created_at, error_message, automation_rules(id, name)")
      .eq("organization_id", organizationId)
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false }),
    supabase
      .from("desktop_agents")
      .select("*")
      .eq("organization_id", organizationId)
      .order("last_seen_at", { ascending: false }),
  ]);

  assertNoError(salesTodayResult, "sales");
  assertNoError(recentSalesResult, "sales");
  assertNoError(productsResult, "products");
  assertNoError(optionsResult, "options");
  assertNoError(pendingCommandsResult, "remote_commands");
  assertNoError(automationLogsResult, "automation_logs");
  assertNoError(desktopAgentsResult, "desktop_agents");

  const automationLogsToday = (automationLogsResult.data ?? []).map((row) => {
    const rule = Array.isArray(row.automation_rules)
      ? row.automation_rules[0]
      : row.automation_rules;

    return {
      id: row.id as string,
      status: row.status as string,
      created_at: row.created_at as string,
      error_message: (row.error_message as string | null) ?? null,
      automation_rules: rule
        ? { id: rule.id as string, name: rule.name as string }
        : null,
    };
  });

  return {
    organizationId,
    salesToday: (salesTodayResult.data ?? []) as DashboardSaleRow[],
    recentSales: (recentSalesResult.data ?? []) as DashboardSaleRow[],
    products: (productsResult.data ?? []) as DashboardProductRow[],
    options: (optionsResult.data ?? []) as DashboardOptionRow[],
    pendingCommands: (pendingCommandsResult.data ?? []) as DashboardRemoteCommandRow[],
    automationLogsToday,
    desktopAgents: (desktopAgentsResult.data ?? []) as DesktopAgentRecord[],
  };
}

const DASHBOARD_REALTIME_TABLES = [
  "sales",
  "products",
  "options",
  "remote_commands",
  "automation_logs",
  "desktop_agents",
] as const;

export function subscribeDashboardChanges(
  organizationId: string,
  onChange: () => void
) {
  const channel = supabase.channel(`mobile-dashboard:${organizationId}`);

  for (const table of DASHBOARD_REALTIME_TABLES) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `organization_id=eq.${organizationId}`,
      },
      () => onChange()
    );
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
