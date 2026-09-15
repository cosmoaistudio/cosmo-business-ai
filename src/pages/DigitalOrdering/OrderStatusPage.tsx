import { Clock3, Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import DigitalOrderingLayout from "@/features/digital-ordering/components/DigitalOrderingLayout";
import OrderStatusTimeline from "@/features/digital-ordering/components/OrderStatusTimeline";
import OrderReadyBanner from "@/features/digital-ordering/components/OrderReadyBanner";
import { useDigitalStoreFromQuery } from "@/features/digital-ordering/hooks/useDigitalStore";
import { useOrderStatus } from "@/features/digital-ordering/hooks/useOrderStatus";
import { isOrderReady } from "@/features/digital-ordering/utils/orderTimeline";
import { formatCurrency } from "@/lib/format";

export default function DigitalOrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { store, loading: storeLoading } = useDigitalStoreFromQuery(
    searchParams.toString()
  );
  const { order, loading, error } = useOrderStatus(
    orderId,
    store?.organizationId ?? null,
    store?.slug ?? searchParams.get("store")
  );

  if (storeLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DigitalOrderingLayout store={store}>
      <div className="mx-auto w-full max-w-xl">
        <h1 className="mb-2 text-3xl font-bold">Acompanhe seu pedido</h1>
        <p className="mb-6 text-slate-300">
          Atualizações em tempo real da cozinha até a entrega.
        </p>

        {error && (
          <div className="mb-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        )}

        {order && (
          <>
            <OrderReadyBanner
              visible={isOrderReady(order.status)}
              saleNumber={order.saleNumber}
            />

            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Pedido</p>
                  <p className="text-2xl font-bold">#{order.saleNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                <Clock3 className="h-4 w-4" />
                Tempo estimado: ~{order.estimatedMinutes} min
              </div>
            </div>

            <OrderStatusTimeline currentStatus={order.status} />
          </>
        )}
      </div>
    </DigitalOrderingLayout>
  );
}
