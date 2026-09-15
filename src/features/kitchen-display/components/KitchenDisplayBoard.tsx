import { ChefHat, RefreshCw, Settings2 } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { SkeletonPage } from "@/motion";
import { useKitchenDisplay } from "../hooks/useKitchenDisplay";
import KitchenFilters from "./KitchenFilters";
import KitchenOrderColumn from "./KitchenOrderColumn";
import KitchenSettingsPanel from "./KitchenSettingsPanel";
import KitchenStatsBar from "./KitchenStatsBar";
import type { KitchenColumn } from "../types/kitchenDisplay.types";

const COLUMNS: KitchenColumn[] = ["queue", "preparing", "ready", "delivered"];

export default function KitchenDisplayBoard() {
  const {
    tickets,
    loading,
    error,
    filter,
    setFilter,
    metrics,
    settings,
    updateSettings,
    advanceTicket,
    reload,
    newTicketIds,
  } = useKitchenDisplay();

  const [showSettings, setShowSettings] = useState(false);

  if (loading && tickets.length === 0) {
    return <SkeletonPage label="Carregando Kitchen Display" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filas de produção"
        subtitle="Monitor em tempo real — integrado ao PDV."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            >
              <Settings2 size={16} />
              Configurações
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <ChefHat size={16} />
        Modo touch {settings.touchMode ? "ativo" : "inativo"} · Auto refresh{" "}
        {settings.autoRefreshSeconds}s
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <KitchenStatsBar metrics={metrics} />
      <KitchenFilters value={filter} onChange={setFilter} />

      {showSettings ? (
        <KitchenSettingsPanel settings={settings} onChange={updateSettings} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <KitchenOrderColumn
            key={column}
            column={column}
            tickets={tickets}
            settings={settings}
            newTicketIds={newTicketIds}
            onAdvance={(ticket) => void advanceTicket(ticket)}
          />
        ))}
      </div>
    </div>
  );
}
