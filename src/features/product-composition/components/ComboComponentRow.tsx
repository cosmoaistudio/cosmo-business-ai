import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/features/products/types/product";
import type { ProductComboComponent } from "../types/combo";

export interface ComboComponentRowProps {
  row: ProductComboComponent;
  index: number;
  catalog: Product[];
  disabled?: boolean;
  onQuantityChange: (quantity: number) => void;
  onDisplayNameChange: (value: string) => void;
  onProductChange: (productId: string) => void;
  onAllowConfigurationChange: (value: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** No modo choice a qty do slot não é editável (sempre 1 no pool). */
  hideQuantity?: boolean;
}

export default function ComboComponentRow({
  row,
  index,
  catalog,
  disabled,
  onQuantityChange,
  onDisplayNameChange,
  onProductChange,
  onAllowConfigurationChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  hideQuantity,
}: ComboComponentRowProps) {
  const title =
    row.display_name?.trim() ||
    row.component_product?.name ||
    `Produto ${index + 1}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">
            {row.component_product?.name ?? "Selecione um produto"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={disabled || !canMoveUp}
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"
            onClick={onMoveUp}
            aria-label="Subir"
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            disabled={disabled || !canMoveDown}
            className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-40"
            onClick={onMoveDown}
            aria-label="Descer"
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="button"
            disabled={disabled}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
            onClick={onRemove}
            aria-label="Remover"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Produto</span>
          <select
            className="cosmo-input w-full p-2.5"
            value={row.component_product_id}
            disabled={disabled}
            onChange={(event) => onProductChange(event.target.value)}
          >
            {catalog.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
            {!catalog.some((product) => product.id === row.component_product_id) && (
              <option value={row.component_product_id}>
                {row.component_product?.name ?? "Produto indisponível"}
              </option>
            )}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-600">
            Nome exibido (opcional)
          </span>
          <input
            key={`${row.id}:${row.display_name ?? ""}`}
            className="cosmo-input w-full p-2.5"
            defaultValue={row.display_name ?? ""}
            disabled={disabled}
            placeholder={row.component_product?.name ?? "Ex.: Açaí 1"}
            onBlur={(event) =>
              onDisplayNameChange(event.target.value.trim())
            }
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!hideQuantity && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-600">
                Quantidade
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  disabled={disabled || row.quantity <= 1}
                  className="rounded-lg bg-white p-2 shadow-sm disabled:opacity-40"
                  onClick={() => onQuantityChange(row.quantity - 1)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                  {row.quantity}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  className="rounded-lg bg-white p-2 shadow-sm disabled:opacity-40"
                  onClick={() => onQuantityChange(row.quantity + 1)}
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={row.allow_configuration}
              disabled={disabled}
              onChange={(event) =>
                onAllowConfigurationChange(event.target.checked)
              }
            />
            Cliente pode escolher adicionais
          </label>
        </div>
        {hideQuantity && (
          <p className="text-xs text-slate-500">Disponível para escolha</p>
        )}
      </div>
    </div>
  );
}
