import { supabase } from "@/config/supabase";
import type { DigitalOrderStatusStep } from "../types/digitalOrdering.types";
import { mapKitchenStatusToDigital } from "../utils/orderTimeline";

export function subscribeDigitalOrderStatus(input: {
  saleId: string;
  onStatusChange: (status: DigitalOrderStatusStep, saleNumber: number) => void;
}) {
  const channel = supabase
    .channel(`digital-order:${input.saleId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "kitchen_tickets",
        filter: `sale_id=eq.${input.saleId}`,
      },
      (payload) => {
        const row = payload.new as { status?: string; sale_number?: number };
        if (!row.status) return;
        input.onStatusChange(
          mapKitchenStatusToDigital(row.status),
          row.sale_number ?? 0
        );
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
