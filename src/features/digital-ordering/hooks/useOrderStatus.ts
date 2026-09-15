import { useCallback, useEffect, useRef, useState } from "react";
import { digitalOrderingService } from "../services/digitalOrdering.service";
import { subscribeDigitalOrderStatus } from "../integrations/realtime.adapter";
import type { DigitalOrderContext, DigitalOrderStatusStep } from "../types/digitalOrdering.types";
import { isOrderReady } from "../utils/orderTimeline";

export interface OrderStatusView {
  id: string;
  saleNumber: number;
  status: DigitalOrderStatusStep;
  estimatedMinutes: number;
  total: number;
  updatedAt: string;
  context: DigitalOrderContext | null;
  readyNotified: boolean;
}

export function useOrderStatus(
  orderId: string | undefined,
  organizationId?: string | null,
  storeSlug?: string | null
) {
  const [order, setOrder] = useState<OrderStatusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const readyRef = useRef(false);

  const load = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await digitalOrderingService.getOrderStatus(
        orderId,
        organizationId,
        storeSlug
      );
      if (!result) {
        setError("Pedido não encontrado.");
        setOrder(null);
      } else {
        setOrder(result);
        setError(null);

        if (isOrderReady(result.status) && !result.readyNotified && organizationId) {
          if (!readyRef.current) {
            readyRef.current = true;
            digitalOrderingService.markReadyNotified(organizationId, orderId);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId, organizationId, storeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = subscribeDigitalOrderStatus({
      saleId: orderId,
      onStatusChange: (status, saleNumber) => {
        setOrder((current) =>
          current
            ? { ...current, status, saleNumber: saleNumber || current.saleNumber }
            : current
        );
      },
    });

    // Checkout público (anon): Realtime em kitchen_tickets pode não estar disponível.
    const pollInterval =
      storeSlug != null
        ? window.setInterval(() => {
            void load();
          }, 30_000)
        : null;

    return () => {
      unsubscribe();
      if (pollInterval != null) window.clearInterval(pollInterval);
    };
  }, [orderId, storeSlug, load]);

  return { order, loading, error, reload: load };
}
