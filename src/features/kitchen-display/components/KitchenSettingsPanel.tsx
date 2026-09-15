import type { KitchenDisplaySettings } from "../types/kitchenSettings.types";
import { KITCHEN_PRIORITY_LABELS, type KitchenPriority } from "../types/kitchenDisplay.types";

interface KitchenSettingsPanelProps {
  settings: KitchenDisplaySettings;
  onChange: (patch: Partial<KitchenDisplaySettings>) => void;
}

export default function KitchenSettingsPanel({
  settings,
  onChange,
}: KitchenSettingsPanelProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        Som de novo pedido
        <input
          type="checkbox"
          checked={settings.soundEnabled}
          onChange={(event) => onChange({ soundEnabled: event.target.checked })}
          className="h-5 w-5"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Volume do som
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.soundVolume}
          onChange={(event) => onChange({ soundVolume: Number(event.target.value) })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Tempo máximo (min)
        <input
          type="number"
          min={5}
          max={120}
          value={settings.maxPrepMinutes}
          onChange={(event) => onChange({ maxPrepMinutes: Number(event.target.value) })}
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Auto atualização (seg)
        <input
          type="number"
          min={5}
          max={120}
          value={settings.autoRefreshSeconds}
          onChange={(event) =>
            onChange({ autoRefreshSeconds: Number(event.target.value) })
          }
          className="rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        Modo touch
        <input
          type="checkbox"
          checked={settings.touchMode}
          onChange={(event) => onChange({ touchMode: event.target.checked })}
          className="h-5 w-5"
        />
      </label>

      <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        Tela cheia
        <input
          type="checkbox"
          checked={settings.fullscreen}
          onChange={(event) => onChange({ fullscreen: event.target.checked })}
          className="h-5 w-5"
        />
      </label>

      <div className="md:col-span-2">
        <p className="mb-2 text-sm font-medium text-slate-700">Cor por prioridade</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(KITCHEN_PRIORITY_LABELS) as KitchenPriority[]).map((priority) => (
            <label key={priority} className="flex flex-col gap-1 text-xs text-slate-600">
              {KITCHEN_PRIORITY_LABELS[priority]}
              <input
                type="color"
                value={settings.priorityColors[priority]}
                onChange={(event) =>
                  onChange({
                    priorityColors: {
                      ...settings.priorityColors,
                      [priority]: event.target.value,
                    },
                  })
                }
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-200"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
