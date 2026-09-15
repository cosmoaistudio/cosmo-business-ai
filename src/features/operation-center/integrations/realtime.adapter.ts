import { supabase } from "@/config/supabase";
import { DomainEvents } from "@/core/types/events";
import type { DomainEvent } from "@/core/types/events";
import type { TimelineEvent } from "../types/operationCenter";

export function subscribeOperationRealtime(input: {
  organizationId: string;
  onKitchenChange: () => void;
  onDesktopChange: () => void;
  onSaleChange: () => void;
}) {
  const channel = supabase
    .channel(`operation-center:${input.organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "kitchen_tickets",
        filter: `organization_id=eq.${input.organizationId}`,
      },
      () => input.onKitchenChange()
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "desktop_agents",
        filter: `organization_id=eq.${input.organizationId}`,
      },
      () => input.onDesktopChange()
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sales",
      },
      () => input.onSaleChange()
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        input.onKitchenChange();
      }
    });

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
    isConnected: () => true,
  };
}

export function domainEventToTimelineEvent(event: DomainEvent): TimelineEvent | null {
  const ts = event.timestamp;

  switch (event.type) {
    case DomainEvents.SaleCompleted:
      return {
        id: event.id,
        timestamp: ts,
        label: "Venda realizada",
        description: `Pedido #${event.payload.saleNumber ?? "—"}`,
        type: "sale",
        live: true,
      };
    case DomainEvents.ProductPaused:
      return {
        id: event.id,
        timestamp: ts,
        label: "Produto pausado",
        description: String(event.payload.entityId ?? "Produto"),
        type: "product_paused",
        live: true,
      };
    case DomainEvents.ProductActivated:
      return {
        id: event.id,
        timestamp: ts,
        label: "Produto reativado",
        description: String(event.payload.entityId ?? "Produto"),
        type: "product_activated",
        live: true,
      };
    case DomainEvents.StockChanged:
      return {
        id: event.id,
        timestamp: ts,
        label: "Estoque atualizado",
        description: String(event.payload.entityId ?? "Item"),
        type: "stock",
        live: true,
      };
    case DomainEvents.OrderCompleted:
      return {
        id: event.id,
        timestamp: ts,
        label: "Pedido entregue",
        description: `Pedido #${event.payload.saleNumber ?? "—"}`,
        type: "order_delivered",
        live: true,
      };
    default:
      return null;
  }
}
