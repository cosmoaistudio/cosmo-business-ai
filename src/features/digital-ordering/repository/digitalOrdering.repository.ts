import { supabase } from "@/config/supabase";
import type { DigitalPlacedOrder } from "../types/digitalOrdering.types";
import type { DigitalOrderStatusStep } from "../types/digitalOrdering.types";
import { mapKitchenStatusToDigital } from "../utils/orderTimeline";

const ORDERS_PREFIX = "cosmo:digital-orders:";

function ordersKey(organizationId: string) {
  return `${ORDERS_PREFIX}${organizationId}`;
}

export interface PublicOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  options?: Array<{ option_id: string; quantity?: number }>;
  components?: Array<{
    component_id: string;
    product_id: string;
    quantity?: number;
    unit_index?: number;
    label?: string;
    options?: Array<{ option_id: string; quantity?: number }>;
  }>;
}

export interface PlacePublicOrderPayload {
  storeSlug: string;
  items: PublicOrderItem[];
  paymentMethod: string;
  paymentAmount: number;
  discount?: number;
  observation?: string | null;
  context?: Record<string, unknown>;
}

export interface PlacePublicOrderResult {
  id: string;
  sale_number: number;
  total: number;
  estimated_minutes?: number;
  organization_id?: string;
}

export function saveLocalDigitalOrder(order: DigitalPlacedOrder) {
  const key = ordersKey(order.organizationId);
  const existing = loadLocalDigitalOrders(order.organizationId);
  const next = [order, ...existing.filter((entry) => entry.id !== order.id)].slice(
    0,
    200
  );
  localStorage.setItem(key, JSON.stringify(next));
}

export function loadLocalDigitalOrders(organizationId: string): DigitalPlacedOrder[] {
  const raw = localStorage.getItem(ordersKey(organizationId));
  if (!raw) return [];

  try {
    return JSON.parse(raw) as DigitalPlacedOrder[];
  } catch {
    return [];
  }
}

export function findLocalDigitalOrder(
  organizationId: string,
  orderId: string
): DigitalPlacedOrder | null {
  return loadLocalDigitalOrders(organizationId).find((order) => order.id === orderId) ?? null;
}

export function updateLocalDigitalOrderStatus(
  organizationId: string,
  orderId: string,
  status: DigitalOrderStatusStep,
  readyNotified = false
) {
  const orders = loadLocalDigitalOrders(organizationId);
  const next = orders.map((order) =>
    order.id === orderId
      ? { ...order, status, readyNotified: readyNotified || order.readyNotified }
      : order
  );
  localStorage.setItem(ordersKey(organizationId), JSON.stringify(next));
}

export async function placePublicDigitalOrder(
  payload: PlacePublicOrderPayload
): Promise<PlacePublicOrderResult> {
  const { data, error } = await supabase.rpc("place_public_digital_order", {
    p_store_slug: payload.storeSlug,
    p_items: payload.items,
    p_payment_method: payload.paymentMethod,
    p_payment_amount: payload.paymentAmount,
    p_discount: payload.discount ?? 0,
    p_observation: payload.observation ?? null,
    p_context: payload.context ?? {},
  });

  if (error) throw error;
  return data as PlacePublicOrderResult;
}

export async function fetchPublicOrderStatus(storeSlug: string, saleId: string) {
  const { data, error } = await supabase.rpc("get_public_order_status", {
    p_store_slug: storeSlug,
    p_sale_id: saleId,
  });

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    sale_number: number;
    total: number;
    kitchen_status: string;
    estimated_minutes: number;
    updated_at: string;
  };

  return {
    id: row.id,
    saleNumber: row.sale_number,
    status: mapKitchenStatusToDigital(row.kitchen_status),
    estimatedMinutes: row.estimated_minutes ?? 20,
    total: Number(row.total),
    updatedAt: row.updated_at,
  };
}

export async function fetchKitchenTicketStatusBySaleId(saleId: string) {
  const result = await supabase
    .from("kitchen_tickets")
    .select("id, status, sale_number, estimated_minutes, created_at, updated_at")
    .eq("sale_id", saleId)
    .maybeSingle();

  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    ticketId: result.data.id as string,
    status: mapKitchenStatusToDigital(result.data.status as string),
    saleNumber: result.data.sale_number as number,
    estimatedMinutes: (result.data.estimated_minutes as number) ?? 20,
    updatedAt: result.data.updated_at as string,
  };
}

export async function fetchSaleSummary(saleId: string) {
  const result = await supabase
    .from("sales")
    .select("id, sale_number, total, status, created_at, organization_id")
    .eq("id", saleId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data;
}
