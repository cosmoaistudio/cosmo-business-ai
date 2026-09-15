import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DigitalOrderingProvider } from "@/features/digital-ordering/context/DigitalOrderingContext";
import { useDigitalStoreFromQuery } from "@/features/digital-ordering/hooks/useDigitalStore";
import DigitalOrderingExperience from "@/features/digital-ordering/components/DigitalOrderingExperience";

export default function DigitalPickupPage() {
  const [searchParams] = useSearchParams();
  const { store, loading, error } = useDigitalStoreFromQuery(searchParams.toString());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        {error ?? "Retirada indisponível."}
      </div>
    );
  }

  if (!store.acceptsPickup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        Esta loja não aceita pedidos para retirada no momento.
      </div>
    );
  }

  return (
    <DigitalOrderingProvider store={store} mode="pickup">
      <DigitalOrderingExperience mode="pickup" />
    </DigitalOrderingProvider>
  );
}
