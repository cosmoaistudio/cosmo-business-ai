import { BellRing } from "lucide-react";

interface OrderReadyBannerProps {
  visible: boolean;
  saleNumber: number;
}

export default function OrderReadyBanner({
  visible,
  saleNumber,
}: OrderReadyBannerProps) {
  if (!visible) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-3xl border border-emerald-400/40 bg-emerald-500/15 px-5 py-4 text-emerald-100">
      <BellRing className="h-6 w-6 shrink-0 animate-pulse" />
      <div>
        <p className="font-semibold">Seu pedido #{saleNumber} está pronto!</p>
        <p className="text-sm text-emerald-200/90">
          Dirija-se ao balcão ou aguarde a entrega na mesa.
        </p>
      </div>
    </div>
  );
}
