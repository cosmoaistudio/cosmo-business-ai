import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import type { DigitalOrderMode } from "@/features/digital-ordering/types/digitalStore.types";
import { DigitalOrderingProvider } from "@/features/digital-ordering/context/DigitalOrderingContext";
import { useDigitalStore } from "@/features/digital-ordering/hooks/useDigitalStore";
import DigitalOrderingExperience from "@/features/digital-ordering/components/DigitalOrderingExperience";

function resolveMode(searchParams: URLSearchParams): DigitalOrderMode {
  const mode = searchParams.get("mode");
  if (mode === "event") return "event";
  return "pickup";
}

export default function DigitalMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { store, loading, error } = useDigitalStore(slug);
  const mode = resolveMode(searchParams);

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
        {error ?? "Loja indisponível."}
      </div>
    );
  }

  return (
    <DigitalOrderingProvider store={store} mode={mode}>
      <DigitalOrderingExperience mode={mode} />
    </DigitalOrderingProvider>
  );
}
