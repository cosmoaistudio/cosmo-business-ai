import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderSize } from "../types/builder";
import SortableList from "./SortableList";

interface ProductSizeEditorProps {
  sizes: BuilderSize[];
  onAdd: () => void;
  onUpdate: (sizeId: string, patch: Partial<BuilderSize>) => void;
  onRemove: (sizeId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function ProductSizeEditor({
  sizes,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}: ProductSizeEditorProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Tamanhos
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Variantes de preço
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ex.: 300ml, 500ml, 700ml — cada tamanho com seu preço no PDV.
          </p>
        </div>

        <Button type="button" variant="outline" className="rounded-xl" onClick={onAdd}>
          <Plus size={16} />
          Adicionar tamanho
        </Button>
      </div>

      <SortableList
        items={sizes}
        getKey={(size) => size.id}
        onReorder={onReorder}
        emptyMessage="Adicione tamanhos para produtos como açaí, sorvete ou pizza."
        renderItem={(size) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_140px_auto_auto]">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Nome
                </label>
                <Input
                  value={size.name}
                  onChange={(event) =>
                    onUpdate(size.id, { name: event.target.value })
                  }
                  placeholder="300ml"
                  className="rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Preço
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={size.price}
                  onChange={(event) =>
                    onUpdate(size.id, {
                      price: Number(event.target.value) || 0,
                    })
                  }
                  className="rounded-xl bg-white"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={size.active}
                    onChange={(event) =>
                      onUpdate(size.id, { active: event.target.checked })
                    }
                  />
                  Disponível
                </label>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-xl text-red-600"
                  onClick={() => onRemove(size.id)}
                  aria-label={`Remover ${size.name}`}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      />
    </section>
  );
}
