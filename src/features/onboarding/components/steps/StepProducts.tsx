import { Plus, Trash2 } from "lucide-react";
import type { OnboardingState } from "../../types/onboarding";

interface StepProps {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

function createId() {
  return crypto.randomUUID();
}

export function Step5Products({ state, onChange }: StepProps) {
  const defaultCategory = state.categories[0] ?? "Geral";

  const addProduct = () => {
    onChange({
      products: [
        ...state.products,
        {
          id: createId(),
          name: "",
          category: defaultCategory,
          price: 0,
          created: false,
        },
      ],
    });
  };

  const updateProduct = (
    id: string,
    patch: Partial<(typeof state.products)[number]>
  ) => {
    onChange({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  };

  const removeProduct = (id: string) => {
    onChange({ products: state.products.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Cadastre seus primeiros produtos. Eles serão criados ao avançar para a
        próxima etapa.
      </p>

      {state.products.length === 0 && (
        <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Adicione pelo menos um produto para começar a vender.
        </div>
      )}

      <div className="space-y-3">
        {state.products.map((product) => (
          <div
            key={product.id}
            className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_140px_120px_auto]"
          >
            <label>
              <span className="text-xs font-semibold text-slate-600">Nome</span>
              <input
                className="cosmo-input mt-1 w-full"
                value={product.name}
                disabled={product.created}
                onChange={(e) =>
                  updateProduct(product.id, { name: e.target.value })
                }
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-600">Categoria</span>
              <select
                className="cosmo-input mt-1 w-full"
                value={product.category}
                disabled={product.created}
                onChange={(e) =>
                  updateProduct(product.id, { category: e.target.value })
                }
              >
                {state.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-slate-600">Preço (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className="cosmo-input mt-1 w-full"
                value={product.price || ""}
                disabled={product.created}
                onChange={(e) =>
                  updateProduct(product.id, {
                    price: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <div className="flex items-end">
              {product.created ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Criado
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="rounded-xl p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProduct}
        className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
      >
        <Plus size={16} />
        Adicionar produto
      </button>
    </div>
  );
}
