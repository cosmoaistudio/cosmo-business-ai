import { ArrowDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConditionBuilder from "./ConditionBuilder";
import ActionBuilder from "./ActionBuilder";
import type { CreateAutomationRuleDTO } from "../types/automationRule";
import type { AutomationModule } from "../types/automationRule";
import {
  AUTOMATION_EVENT_LABELS,
  AUTOMATION_MODULE_LABELS,
  EVENTS_BY_MODULE,
} from "../utils/automationLabels";

interface RuleBuilderProps {
  form: CreateAutomationRuleDTO;
  saving?: boolean;
  onChange: (form: CreateAutomationRuleDTO) => void;
  onModuleChange: (module: AutomationModule) => void;
  onTriggerChange: (trigger: string) => void;
  onConditionsChange: CreateAutomationRuleDTO["conditions"] extends infer T
    ? (conditions: T) => void
    : never;
  onActionsChange: CreateAutomationRuleDTO["actions"] extends infer T
    ? (actions: T) => void
    : never;
  onSave: () => void;
}

export default function RuleBuilder({
  form,
  saving = false,
  onChange,
  onModuleChange,
  onTriggerChange,
  onConditionsChange,
  onActionsChange,
  onSave,
}: RuleBuilderProps) {
  const availableEvents = EVENTS_BY_MODULE[form.module] ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="automation-name" className="mb-2 block text-sm font-medium text-slate-700">
            Nome da automação
          </label>
          <Input
            id="automation-name"
            value={form.name}
            onChange={(event) =>
              onChange({ ...form, name: event.target.value })
            }
            placeholder="Ex.: Pausar produto com estoque baixo"
            className="rounded-xl"
          />
        </div>

        <div>
          <label htmlFor="automation-priority" className="mb-2 block text-sm font-medium text-slate-700">
            Prioridade
          </label>
          <Input
            id="automation-priority"
            type="number"
            min={0}
            value={form.priority}
            onChange={(event) =>
              onChange({ ...form, priority: Number(event.target.value) || 0 })
            }
            className="rounded-xl"
          />
        </div>
      </div>

      <div>
        <label htmlFor="automation-description" className="mb-2 block text-sm font-medium text-slate-700">
          Descrição
        </label>
        <textarea
          id="automation-description"
          value={form.description ?? ""}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
          rows={2}
          placeholder="Descreva o objetivo desta automação"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Fluxo visual
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            SE → ENTÃO
          </h2>
        </div>

        <div className="space-y-0">
          <section className="border-b border-slate-100 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
                SE
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Evento</h3>
                <p className="text-sm text-slate-500">
                  Quando isso acontecer no sistema
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Módulo
                </label>
                <select
                  value={form.module}
                  onChange={(event) =>
                    onModuleChange(event.target.value as AutomationModule)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {Object.entries(AUTOMATION_MODULE_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Evento
                </label>
                <select
                  value={form.trigger_type}
                  onChange={(event) => onTriggerChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {availableEvents.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {AUTOMATION_EVENT_LABELS[eventType]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-center py-2">
            <ArrowDown className="text-slate-300" />
          </div>

          <section className="border-b border-slate-100 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-sm font-black text-white">
                E
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Condição</h3>
                <p className="text-sm text-slate-500">
                  Opcional — filtre quando a automação deve rodar
                </p>
              </div>
            </div>

            <ConditionBuilder
              conditions={form.conditions}
              onChange={onConditionsChange}
            />
          </section>

          <div className="flex justify-center py-2">
            <ArrowDown className="text-slate-300" />
          </div>

          <section className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white">
                ENTÃO
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Ação</h3>
                <p className="text-sm text-slate-500">
                  O que o sistema deve fazer automaticamente
                </p>
              </div>
            </div>

            <ActionBuilder actions={form.actions} onChange={onActionsChange} />
          </section>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          className="rounded-xl"
          disabled={saving}
          onClick={onSave}
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar automação"}
        </Button>
      </div>
    </div>
  );
}
