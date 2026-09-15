import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutomationAction, AutomationActionType } from "../types/automationRule";
import { AUTOMATION_ACTION_LABELS } from "../utils/automationLabels";

interface ActionBuilderProps {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
}

export default function ActionBuilder({
  actions,
  onChange,
}: ActionBuilderProps) {
  function updateAction(id: string, patch: Partial<AutomationAction>) {
    onChange(
      actions.map((action) =>
        action.id === id ? { ...action, ...patch } : action
      )
    );
  }

  function updateActionParam(
    id: string,
    key: string,
    value: string
  ) {
    onChange(
      actions.map((action) =>
        action.id === id
          ? {
              ...action,
              params: { ...action.params, [key]: value },
            }
          : action
      )
    );
  }

  function removeAction(id: string) {
    onChange(actions.filter((action) => action.id !== id));
  }

  function addAction(type: AutomationActionType) {
    onChange([
      ...actions,
      {
        id: crypto.randomUUID(),
        type,
        params: getDefaultParams(type),
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {actions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Adicione ao menos uma ação para concluir a automação.
        </p>
      )}

      {actions.map((action) => (
        <div
          key={action.id}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <select
              value={action.type}
              onChange={(event) => {
                const type = event.target.value as AutomationActionType;
                updateAction(action.id, {
                  type,
                  params: getDefaultParams(type),
                });
              }}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium"
            >
              {Object.entries(AUTOMATION_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl text-red-600"
              onClick={() => removeAction(action.id)}
              aria-label="Remover ação"
            >
              <Trash2 size={16} />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(action.params).map(([key, value]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  {key}
                </label>
                <input
                  type="text"
                  value={String(value ?? "")}
                  onChange={(event) =>
                    updateActionParam(action.id, key, event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => addAction("SEND_NOTIFICATION")}
        >
          <Plus size={16} />
          Adicionar ação
        </Button>
      </div>
    </div>
  );
}

function getDefaultParams(type: AutomationActionType) {
  switch (type) {
    case "PAUSE_PRODUCT":
    case "ACTIVATE_PRODUCT":
      return { productId: "{{productId}}" };
    case "PAUSE_OPTION":
    case "ACTIVATE_OPTION":
      return { optionId: "{{optionId}}" };
    case "CREATE_FINANCIAL_ENTRY":
      return {
        type: "expense",
        category: "supplies",
        amount: "100",
        description: "Reposição automática",
      };
    case "CREATE_PURCHASE_SUGGESTION":
      return { productName: "{{productName}}", quantity: "10" };
    case "SEND_EMAIL":
    case "SEND_WHATSAPP":
      return { to: "", message: "Alerta do Cosmo Business AI" };
    default:
      return { message: "Alerta de automação" };
  }
}
