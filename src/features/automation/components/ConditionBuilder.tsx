import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutomationCondition } from "../types/automationRule";
import { CONDITION_OPERATOR_LABELS } from "../utils/automationLabels";

interface ConditionBuilderProps {
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
}

const COMMON_FIELDS = [
  { value: "stock", label: "Estoque" },
  { value: "min_stock", label: "Estoque mínimo" },
  { value: "total", label: "Total da venda" },
  { value: "amount", label: "Valor" },
  { value: "status", label: "Status" },
  { value: "movement_type", label: "Tipo de movimentação" },
  { value: "productName", label: "Nome do produto" },
  { value: "customerName", label: "Nome do cliente" },
];

export default function ConditionBuilder({
  conditions,
  onChange,
}: ConditionBuilderProps) {
  function updateCondition(
    id: string,
    patch: Partial<AutomationCondition>
  ) {
    onChange(
      conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition
      )
    );
  }

  function removeCondition(id: string) {
    onChange(conditions.filter((condition) => condition.id !== id));
  }

  return (
    <div className="space-y-3">
      {conditions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Sem condições — a automação será executada sempre que o evento ocorrer.
        </p>
      )}

      {conditions.map((condition) => (
        <div
          key={condition.id}
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <select
            value={condition.field}
            onChange={(event) =>
              updateCondition(condition.id, { field: event.target.value })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {COMMON_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          <select
            value={condition.operator}
            onChange={(event) =>
              updateCondition(condition.id, {
                operator: event.target.value as AutomationCondition["operator"],
              })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {Object.entries(CONDITION_OPERATOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {condition.operator !== "exists" ? (
            <input
              type="text"
              value={String(condition.value ?? "")}
              onChange={(event) =>
                updateCondition(condition.id, { value: event.target.value })
              }
              placeholder="Valor"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          ) : (
            <div className="flex items-center px-3 text-sm text-slate-500">
              Campo deve existir
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl text-red-600"
            onClick={() => removeCondition(condition.id)}
            aria-label="Remover condição"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() =>
          onChange([
            ...conditions,
            {
              id: crypto.randomUUID(),
              field: "stock",
              operator: "lte",
              value: 5,
            },
          ])
        }
      >
        <Plus size={16} />
        Adicionar condição
      </Button>
    </div>
  );
}
