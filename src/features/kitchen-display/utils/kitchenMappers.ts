import type {
  KitchenItemStatus,
  KitchenPriority,
  KitchenStatus,
  KitchenTicket,
  KitchenTicketItem,
  KitchenTicketType,
} from "../types/kitchenDisplay.types";

export interface KitchenTicketRow {
  id: string;
  organization_id: string;
  sale_id: string;
  sale_number: number;
  status: KitchenStatus;
  ticket_type: KitchenTicketType;
  priority: KitchenPriority;
  assigned_to: string | null;
  customer_name: string | null;
  notes: string | null;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface KitchenTicketItemRow {
  id: string;
  ticket_id: string;
  sale_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  summary: string | null;
  status: KitchenItemStatus;
}

export function mapKitchenTicketItemRow(row: KitchenTicketItemRow): KitchenTicketItem {
  return {
    id: row.id,
    saleItemId: row.sale_item_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    summary: row.summary,
    status: row.status,
  };
}

export function mapKitchenTicketRow(
  row: KitchenTicketRow,
  items: KitchenTicketItemRow[]
): KitchenTicket {
  const ticketItems = items
    .filter((item) => item.ticket_id === row.id)
    .map(mapKitchenTicketItemRow);

  return {
    id: row.id,
    organizationId: row.organization_id,
    saleId: row.sale_id,
    saleNumber: row.sale_number,
    status: row.status,
    ticketType: row.ticket_type,
    priority: row.priority,
    assignedTo: row.assigned_to,
    customerName: row.customer_name,
    notes: row.notes,
    estimatedMinutes: row.estimated_minutes,
    items: ticketItems,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function inferTicketTypeFromNotes(notes: string): KitchenTicketType {
  const normalized = notes.toLowerCase();
  if (/delivery|entrega|ifood|uber|rappi/.test(normalized)) return "delivery";
  if (/mesa|table|comanda/.test(normalized)) return "dine_in";
  if (/retirada|balc[aã]o|pickup|takeaway/.test(normalized)) return "pickup";
  return "counter";
}
