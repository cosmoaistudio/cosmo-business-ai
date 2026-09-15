import { supabase } from "@/config/supabase";
import { startOfTodayIso } from "@/lib/date";
import type {
  KitchenPriority,
  KitchenStatus,
} from "../types/kitchenDisplay.types";
import {
  inferTicketTypeFromNotes,
  mapKitchenTicketRow,
  type KitchenTicketItemRow,
  type KitchenTicketRow,
} from "../utils/kitchenMappers";

async function fetchTicketItems(ticketIds: string[]) {
  if (ticketIds.length === 0) return [] as KitchenTicketItemRow[];

  const result = await supabase
    .from("kitchen_ticket_items")
    .select(
      "id, ticket_id, sale_item_id, product_id, product_name, quantity, summary, status"
    )
    .in("ticket_id", ticketIds);

  if (result.error) throw result.error;
  return (result.data ?? []) as KitchenTicketItemRow[];
}

export async function fetchKitchenTickets(organizationId: string) {
  const ticketsResult = await supabase
    .from("kitchen_tickets")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("created_at", startOfTodayIso())
    .order("created_at", { ascending: true });

  if (ticketsResult.error) throw ticketsResult.error;

  const rows = (ticketsResult.data ?? []) as KitchenTicketRow[];
  const ticketIds = rows.map((row) => row.id);
  const items = await fetchTicketItems(ticketIds);

  return rows.map((row) => mapKitchenTicketRow(row, items));
}

export async function syncMissingKitchenTickets(organizationId: string) {
  const salesResult = await supabase
    .from("sales")
    .select("id, sale_number, observation, customer_id, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("created_at", startOfTodayIso())
    .order("created_at", { ascending: false });

  if (salesResult.error) throw salesResult.error;

  const ticketsResult = await supabase
    .from("kitchen_tickets")
    .select("sale_id")
    .eq("organization_id", organizationId)
    .gte("created_at", startOfTodayIso());

  if (ticketsResult.error) throw ticketsResult.error;

  const existing = new Set((ticketsResult.data ?? []).map((row) => row.sale_id));
  const missing = (salesResult.data ?? []).filter((sale) => !existing.has(sale.id));

  if (missing.length === 0) return;

  const customerIds = [
    ...new Set(
      missing.map((sale) => sale.customer_id).filter((id): id is string => Boolean(id))
    ),
  ];

  let customerNames = new Map<string, string>();

  if (customerIds.length > 0) {
    const customersResult = await supabase
      .from("customers")
      .select("id, name")
      .in("id", customerIds);

    if (!customersResult.error) {
      customerNames = new Map(
        (customersResult.data ?? []).map((customer) => [customer.id, customer.name])
      );
    }
  }

  const payload = missing.map((sale) => ({
    organization_id: organizationId,
    sale_id: sale.id,
    sale_number: sale.sale_number,
    status: "pending" as KitchenStatus,
    ticket_type: inferTicketTypeFromNotes(sale.observation ?? ""),
    customer_name: sale.customer_id
      ? customerNames.get(sale.customer_id) ?? null
      : null,
    notes: sale.observation,
    estimated_minutes: 20,
  }));

  const insertResult = await supabase.from("kitchen_tickets").insert(payload);

  if (insertResult.error) throw insertResult.error;
}

export async function updateKitchenTicketStatus(
  ticketId: string,
  status: KitchenStatus,
  assignedTo?: string | null
) {
  const payload: Record<string, unknown> = { status };
  if (assignedTo !== undefined) payload.assigned_to = assignedTo;

  const result = await supabase
    .from("kitchen_tickets")
    .update(payload)
    .eq("id", ticketId)
    .select("*")
    .single();

  if (result.error) throw result.error;
  return result.data as KitchenTicketRow;
}

export async function updateKitchenTicketPriority(
  ticketId: string,
  priority: KitchenPriority
) {
  const result = await supabase
    .from("kitchen_tickets")
    .update({ priority })
    .eq("id", ticketId)
    .select("*")
    .single();

  if (result.error) throw result.error;
  return result.data as KitchenTicketRow;
}

export function subscribeKitchenTickets(
  organizationId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`kitchen-display:${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "kitchen_tickets",
        filter: `organization_id=eq.${organizationId}`,
      },
      () => onChange()
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sales",
        filter: `organization_id=eq.${organizationId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
