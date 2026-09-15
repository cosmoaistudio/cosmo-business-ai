import type { OperationScreen, OperationViewMode } from "../types/operationCenter";
import {
  OPERATION_SCREEN_LABELS,
  OPERATION_VIEW_MODE_LABELS,
} from "../types/operationCenter";
import { Monitor, Tv, UserCog } from "lucide-react";

const SCREENS: OperationScreen[] = [
  "overview",
  "operation",
  "production",
  "delivery",
  "finance",
  "ai",
];

const VIEW_MODES: Array<{
  id: OperationViewMode;
  icon: typeof Monitor;
}> = [
  { id: "operational", icon: Monitor },
  { id: "manager", icon: UserCog },
  { id: "tv", icon: Tv },
];

interface OperationScreenNavProps {
  screen: OperationScreen;
  viewMode: OperationViewMode;
  onScreenChange: (screen: OperationScreen) => void;
  onViewModeChange: (mode: OperationViewMode) => void;
  dark?: boolean;
}

export default function OperationScreenNav({
  screen,
  viewMode,
  onScreenChange,
  onViewModeChange,
  dark = false,
}: OperationScreenNavProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {SCREENS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onScreenChange(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              screen === item
                ? "bg-blue-600 text-white"
                : dark
                  ? "bg-white/10 text-slate-200 hover:bg-white/15"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {OPERATION_SCREEN_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEW_MODES.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={OPERATION_VIEW_MODE_LABELS[id]}
            onClick={() => onViewModeChange(id)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
              viewMode === id
                ? "bg-violet-600 text-white"
                : dark
                  ? "bg-white/10 text-slate-200 hover:bg-white/15"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {OPERATION_VIEW_MODE_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
