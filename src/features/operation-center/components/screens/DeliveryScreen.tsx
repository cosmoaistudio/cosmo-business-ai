import type { OperationCenterData } from "../../types/operationCenter";
import ConnectivityPanel from "../ConnectivityPanel";
import OperationalMap from "../OperationalMap";

interface DeliveryScreenProps {
  data: OperationCenterData;
  tvMode?: boolean;
}

export default function DeliveryScreen({ data, tvMode = false }: DeliveryScreenProps) {
  const deliverySector = data.sectors.filter((s) => s.id === "delivery");

  return (
    <div className="space-y-6">
      <OperationalMap sectors={deliverySector.length ? deliverySector : data.sectors.slice(2, 3)} tvMode={tvMode} />
      <ConnectivityPanel connectivity={data.connectivity} />

      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h3 className="text-lg font-bold text-white">Delivery em tempo real</h3>
        <p className="mt-2 text-sm text-slate-400">
          {data.connectivity.deliveryOnline} entregador(es) online ·{" "}
          {data.realtime.ordersReady} pedido(s) prontos para entrega
        </p>
      </div>
    </div>
  );
}
