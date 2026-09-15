import type { ConnectivityStatus } from "../types/operationCenter";
import { Monitor, Smartphone, Wallet, Truck, Radio } from "lucide-react";

interface ConnectivityPanelProps {
  connectivity: ConnectivityStatus;
  compact?: boolean;
}

const ITEMS: Array<{
  key: keyof ConnectivityStatus;
  label: string;
  icon: typeof Monitor;
  onlineKey?: keyof ConnectivityStatus;
  totalKey?: keyof ConnectivityStatus;
}> = [
  {
    key: "desktopOnline",
    onlineKey: "desktopOnline",
    totalKey: "desktopTotal",
    label: "Desktop",
    icon: Monitor,
  },
  {
    key: "mobileOnline",
    onlineKey: "mobileOnline",
    totalKey: "mobileTotal",
    label: "Mobile",
    icon: Smartphone,
  },
  {
    key: "cashiersOnline",
    onlineKey: "cashiersOnline",
    totalKey: "cashiersTotal",
    label: "Caixas",
    icon: Wallet,
  },
  {
    key: "deliveryOnline",
    onlineKey: "deliveryOnline",
    totalKey: "deliveryTotal",
    label: "Entregadores",
    icon: Truck,
  },
];

export default function ConnectivityPanel({
  connectivity,
  compact = false,
}: ConnectivityPanelProps) {
  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"}`}>
      {ITEMS.map(({ label, icon: Icon, onlineKey, totalKey }) => {
        const online = onlineKey ? connectivity[onlineKey] as number : 0;
        const total = totalKey ? connectivity[totalKey] as number : 1;
        const isOnline = online > 0;

        return (
          <div
            key={label}
            className={`rounded-2xl border px-4 py-3 ${
              isOnline
                ? "border-emerald-400/30 bg-emerald-500/10"
                : "border-red-400/30 bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="mt-2 text-xl font-black">
              {online}/{total}
              <span className="ml-2 text-xs font-normal opacity-70">online</span>
            </p>
          </div>
        );
      })}

      <div
        className={`rounded-2xl border px-4 py-3 ${
          connectivity.realtimeConnected
            ? "border-blue-400/30 bg-blue-500/10"
            : "border-amber-400/30 bg-amber-500/10"
        } ${compact ? "col-span-2" : "lg:col-span-4"}`}
      >
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          <span className="text-sm font-medium">Realtime</span>
        </div>
        <p className="mt-2 text-sm">
          {connectivity.realtimeConnected
            ? "Conectado — atualizações ao vivo ativas"
            : "Reconectando..."}
        </p>
      </div>
    </div>
  );
}
