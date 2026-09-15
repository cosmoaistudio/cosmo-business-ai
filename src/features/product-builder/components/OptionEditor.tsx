import { ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { resolveOptionImage } from "@/features/product-composition/utils/optionImage";
import type { CompositionOption } from "@/features/product-composition/types/option";

interface OptionEditorProps {
  option: CompositionOption;
  allowQuantity?: boolean;
  onChange: (patch: Partial<CompositionOption>) => void;
}

export default function OptionEditor({
  option,
  allowQuantity = false,
  onChange,
}: OptionEditorProps) {
  const imageUrl = resolveOptionImage(option);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[72px_1fr_120px] lg:items-end">
          <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={option.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="text-slate-400" size={20} />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Nome
            </label>
            <Input
              value={option.name}
              onChange={(event) => onChange({ name: event.target.value })}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Preço adicional
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={option.price}
              onChange={(event) =>
                onChange({ price: Number(event.target.value) || 0 })
              }
              className="rounded-xl"
            />
            <p className="mt-1 text-xs text-slate-400">
              {option.price > 0
                ? `+ ${formatCurrency(option.price)}`
                : "Incluso"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              SKU
            </label>
            <Input
              value={option.sku ?? ""}
              onChange={(event) =>
                onChange({ sku: event.target.value || null })
              }
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Código de barras
            </label>
            <Input
              value={option.barcode ?? ""}
              onChange={(event) =>
                onChange({ barcode: event.target.value || null })
              }
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Peso (g)
            </label>
            <Input
              type="number"
              min={0}
              step="0.001"
              value={option.weight ?? 0}
              onChange={(event) =>
                onChange({ weight: Number(event.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Custo
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={option.cost_price ?? 0}
              onChange={(event) =>
                onChange({ cost_price: Number(event.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Tempo preparo (min)
            </label>
            <Input
              type="number"
              min={0}
              value={option.preparation_time ?? 0}
              onChange={(event) =>
                onChange({
                  preparation_time: Number(event.target.value) || 0,
                })
              }
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              URL da imagem
            </label>
            <Input
              value={option.image_url ?? ""}
              onChange={(event) =>
                onChange({ image_url: event.target.value || null })
              }
              className="rounded-xl"
            />
          </div>

          {allowQuantity && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Qtd. mínima
                </label>
                <Input
                  type="number"
                  min={1}
                  value={option.min_quantity ?? 1}
                  onChange={(event) =>
                    onChange({
                      min_quantity: Number(event.target.value) || 1,
                    })
                  }
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Qtd. máxima
                </label>
                <Input
                  type="number"
                  min={1}
                  value={option.max_quantity ?? 99}
                  onChange={(event) =>
                    onChange({
                      max_quantity: Number(event.target.value) || 99,
                    })
                  }
                  className="rounded-xl"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Estoque
            </label>
            <Input
              type="number"
              min={0}
              value={option.stock}
              disabled={!option.stock_control}
              onChange={(event) =>
                onChange({ stock: Number(event.target.value) || 0 })
              }
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={option.active}
              onChange={(event) => onChange({ active: event.target.checked })}
            />
            Disponível
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={option.stock_control}
              onChange={(event) =>
                onChange({ stock_control: event.target.checked })
              }
            />
            Controla estoque
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={option.is_featured ?? false}
              onChange={(event) =>
                onChange({ is_featured: event.target.checked })
              }
            />
            Destaque
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={option.is_default ?? false}
              onChange={(event) =>
                onChange({ is_default: event.target.checked })
              }
            />
            Padrão
          </label>
        </div>
      </div>
    </div>
  );
}
