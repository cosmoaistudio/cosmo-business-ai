import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DigitalOrderingProvider } from "@/features/digital-ordering/context/DigitalOrderingContext";
import { useDigitalStoreFromQuery } from "@/features/digital-ordering/hooks/useDigitalStore";
import DigitalOrderingExperience from "@/features/digital-ordering/components/DigitalOrderingExperience";

export default function DigitalDeliveryPage() {
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
        {error ?? "Delivery indisponível."}
      </div>
    );
  }

  if (!store.acceptsDelivery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        Esta loja não aceita delivery no momento.
      </div>
    );
  }

  return (
    <DigitalOrderingProvider store={store} mode="delivery">
      <DigitalOrderingExperience mode="delivery" />
    </DigitalOrderingProvider>
  );
}
