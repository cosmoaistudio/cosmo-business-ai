import { useEffect } from "react";
import { X } from "lucide-react";
import { SkeletonPage } from "@/motion";
import type {
  OperationCenterData,
  OperationPeriod,
  OperationScreen,
  OperationViewMode,
} from "../types/operationCenter";
import { OPERATION_PERIOD_LABELS } from "../types/operationCenter";
import OperationScreenNav from "./OperationScreenNav";
import OverviewScreen from "./screens/OverviewScreen";
import OperationScreenView from "./screens/OperationScreenView";
import ProductionScreen from "./screens/ProductionScreen";
import DeliveryScreen from "./screens/DeliveryScreen";
import FinanceScreen from "./screens/FinanceScreen";
import AiScreen from "./screens/AiScreen";

interface OperationCenterShellProps {
  data: OperationCenterData | null;
  loading: boolean;
  period: OperationPeriod;
  screen: OperationScreen;
  viewMode: OperationViewMode;
  onPeriodChange: (period: OperationPeriod) => void;
  onScreenChange: (screen: OperationScreen) => void;
  onViewModeChange: (mode: OperationViewMode) => void;
}

export default function OperationCenterShell({
  data,
  loading,
  period,
  screen,
  viewMode,
  onPeriodChange,
  onScreenChange,
  onViewModeChange,
}: OperationCenterShellProps) {
  const tvMode = viewMode === "tv";
  const darkShell = tvMode || viewMode === "manager";

  useEffect(() => {
    if (!tvMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onViewModeChange("operational");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tvMode, onViewModeChange]);

  if (loading && !data) {
    return <SkeletonPage label="Carregando centro de operações" />;
  }

  if (!data) return null;

  const shell = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <OperationScreenNav
          screen={screen}
          viewMode={viewMode}
          onScreenChange={onScreenChange}
          onViewModeChange={onViewModeChange}
          dark={darkShell}
        />

        {!tvMode && (
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(OPERATION_PERIOD_LABELS) as OperationPeriod[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPeriodChange(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    period === item
                      ? "bg-blue-600 text-white"
                      : darkShell
                        ? "bg-white/10 text-slate-300"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {OPERATION_PERIOD_LABELS[item]}
                </button>
              )
            )}
          </div>
        )}
      </div>

      <p className={`text-xs ${darkShell ? "text-slate-400" : "text-slate-500"}`}>
        Tempo real · Atualizado {new Date(data.lastUpdated).toLocaleTimeString("pt-BR")}
        {data.connectivity.realtimeConnected ? " · Realtime ON" : " · Realtime..."}
      </p>

      {renderScreen(data, screen, tvMode)}
    </div>
  );

  if (tvMode) {
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950 p-6 text-white md:p-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => onViewModeChange("operational")}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15"
            >
              <X size={16} />
              Sair do modo TV
            </button>
          </div>
          {shell}
        </div>
      </div>
    );
  }

  if (viewMode === "manager") {
    return (
      <div className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl">
        {shell}
      </div>
    );
  }

  return shell;
}

function renderScreen(
  data: OperationCenterData,
  screen: OperationScreen,
  tvMode: boolean
) {
  switch (screen) {
    case "overview":
      return <OverviewScreen data={data} tvMode={tvMode} />;
    case "operation":
      return <OperationScreenView data={data} />;
    case "production":
      return <ProductionScreen data={data} tvMode={tvMode} />;
    case "delivery":
      return <DeliveryScreen data={data} tvMode={tvMode} />;
    case "finance":
      return <FinanceScreen data={data} />;
    case "ai":
      return <AiScreen data={data} />;
    default:
      return <OverviewScreen data={data} tvMode={tvMode} />;
  }
}
