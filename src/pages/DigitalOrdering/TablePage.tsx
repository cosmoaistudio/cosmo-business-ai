import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { DigitalOrderingProvider } from "@/features/digital-ordering/context/DigitalOrderingContext";
import { useDigitalStoreFromQuery } from "@/features/digital-ordering/hooks/useDigitalStore";
import { digitalStoreService } from "@/features/digital-ordering/services/digitalStore.service";
import type { DigitalStoreTable } from "@/features/digital-ordering/types/digitalStore.types";
import DigitalOrderingExperience from "@/features/digital-ordering/components/DigitalOrderingExperience";

export default function DigitalTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const { store, loading, error } = useDigitalStoreFromQuery(searchParams.toString());
  const [tables, setTables] = useState<DigitalStoreTable[]>([]);

  useEffect(() => {
    if (!store?.organizationId) return;

    void digitalStoreService.loadTables(store.organizationId).then(setTables);
  }, [store?.organizationId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !store || !tableId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
        {error ?? "Mesa não encontrada."}
      </div>
    );
  }

  const table = tables.find((entry) => entry.id === tableId);
  const tableLabel = table?.label ?? `Mesa ${tableId}`;

  return (
    <DigitalOrderingProvider
      store={store}
      mode="dine_in"
      tableId={tableId}
      tableLabel={tableLabel}
    >
      <DigitalOrderingExperience mode="dine_in" tableLabel={tableLabel} />
    </DigitalOrderingProvider>
  );
}
