import { Plus, Trash2 } from "lucide-react";
import type { OnboardingState } from "../../types/onboarding";

interface StepProps {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

function createId() {
  return crypto.randomUUID();
}

export function Step3Tables({ state, onChange }: StepProps) {
  const addTable = () => {
    const number = state.tables.length + 1;
    onChange({
      tables: [
        ...state.tables,
        { id: createId(), label: `Mesa ${number}`, seats: 4 },
      ],
    });
  };

  const removeTable = (id: string) => {
    onChange({ tables: state.tables.filter((t) => t.id !== id) });
  };

  const updateTable = (
    id: string,
    patch: Partial<(typeof state.tables)[number]>
  ) => {
    onChange({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
        Etapa opcional. Adicione mesas para gerar QR Codes de pedido na mesa no
        cardápio digital.
      </p>

      {state.tables.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          Nenhuma mesa cadastrada. Você pode pular esta etapa.
        </p>
      )}

      <div className="space-y-3">
        {state.tables.map((table) => (
          <div
            key={table.id}
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 p-4"
          >
            <label className="min-w-[140px] flex-1">
              <span className="text-xs font-semibold text-slate-600">Nome</span>
              <input
                className="cosmo-input mt-1 w-full"
                value={table.label}
                onChange={(e) => updateTable(table.id, { label: e.target.value })}
              />
            </label>
            <label className="w-24">
              <span className="text-xs font-semibold text-slate-600">Lugares</span>
              <input
                type="number"
                min={1}
                className="cosmo-input mt-1 w-full"
                value={table.seats}
                onChange={(e) =>
                  updateTable(table.id, { seats: Number(e.target.value) || 1 })
                }
              />
            </label>
            <button
              type="button"
              onClick={() => removeTable(table.id)}
              className="rounded-xl p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTable}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
      >
        <Plus size={16} />
        Adicionar mesa
      </button>
    </div>
  );
}

export function Step4Categories({ state, onChange }: StepProps) {
  const addCategory = () => {
    onChange({ categories: [...state.categories, "Nova categoria"] });
  };

  const updateCategory = (index: number, value: string) => {
    const categories = [...state.categories];
    categories[index] = value;
    onChange({ categories });
  };

  const removeCategory = (index: number) => {
    onChange({ categories: state.categories.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Defina as categorias do cardápio. Elas serão usadas ao cadastrar produtos.
      </p>

      <div className="space-y-2">
        {state.categories.map((category, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="cosmo-input flex-1"
              value={category}
              onChange={(e) => updateCategory(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeCategory(index)}
              className="rounded-xl px-3 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCategory}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
      >
        <Plus size={16} />
        Nova categoria
      </button>
    </div>
  );
}
