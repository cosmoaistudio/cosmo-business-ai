import { ChevronDown, ChevronUp, Crown, Sparkles } from "lucide-react";
import {
  OptionGroupStatusBadge,
  OptionGroupTypeBadge,
} from "@/features/product-composition";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type { OptionGroupType } from "@/features/product-composition/types/optionGroup";
import { GROUP_TYPE_OPTIONS, type BuilderGroupState } from "../types/builder";
import OptionEditor from "./OptionEditor";
import SortableList from "./SortableList";

interface OptionGroupEditorProps {
  group: BuilderGroupState;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdateGroup: (patch: Partial<BuilderGroupState["group"]>) => void;
  onUpdateOption: (
    optionId: string,
    patch: Partial<CompositionOption>
  ) => void;
  onReorderOptions: (fromIndex: number, toIndex: number) => void;
}

export default function OptionGroupEditor({
  group,
  index,
  expanded,
  onToggleExpand,
  onUpdateGroup,
  onUpdateOption,
  onReorderOptions,
}: OptionGroupEditorProps) {
  const meta = group.group;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white pr-24 shadow-sm">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              #{index}
            </span>
            <h3 className="text-lg font-bold text-slate-900">{meta.name}</h3>
            <OptionGroupStatusBadge required={meta.required} />
            <OptionGroupTypeBadge selectionType={meta.selection_type} />
            {meta.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                <Crown size={12} />
                Premium
              </span>
            )}
            {meta.hidden && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                Oculto
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {meta.group_type ?? "optional"} · Mín. {meta.min_selection} · Máx.{" "}
            {meta.max_selection === 999 ? "sem limite" : meta.max_selection} ·{" "}
            {group.options.length} opção(ões)
          </p>
        </div>

        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-slate-100 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Nome
              </label>
              <input
                value={meta.name}
                onChange={(event) =>
                  onUpdateGroup({ name: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Tipo
              </label>
              <select
                value={meta.group_type ?? "optional"}
                onChange={(event) =>
                  onUpdateGroup({
                    group_type: event.target.value as OptionGroupType,
                    is_premium: event.target.value === "premium",
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {GROUP_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Estilo de exibição
              </label>
              <select
                value={meta.display_style ?? "list"}
                onChange={(event) =>
                  onUpdateGroup({
                    display_style: event.target.value as typeof meta.display_style,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="list">Lista</option>
                <option value="grid">Grid</option>
                <option value="chips">Chips</option>
                <option value="carousel">Carrossel</option>
                <option value="cards">Cards</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Descrição
              </label>
              <input
                value={meta.description ?? ""}
                onChange={(event) =>
                  onUpdateGroup({ description: event.target.value || null })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Mínimo
              </label>
              <input
                type="number"
                min={0}
                value={meta.min_selection}
                onChange={(event) =>
                  onUpdateGroup({
                    min_selection: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Máximo
              </label>
              <input
                type="number"
                min={0}
                value={meta.max_selection}
                onChange={(event) =>
                  onUpdateGroup({
                    max_selection: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Máximo grátis
              </label>
              <input
                type="number"
                min={0}
                value={meta.max_free ?? 0}
                onChange={(event) =>
                  onUpdateGroup({
                    max_free: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Tipo de seleção
              </label>
              <select
                value={meta.selection_type}
                onChange={(event) =>
                  onUpdateGroup({
                    selection_type: event.target.value as "radio" | "checkbox",
                  })
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="checkbox">Múltipla (checkbox)</option>
                <option value="radio">Única (radio)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Cor
              </label>
              <input
                type="color"
                value={meta.color ?? "#2563eb"}
                onChange={(event) =>
                  onUpdateGroup({ color: event.target.value })
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-1 py-1"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Ícone
              </label>
              <input
                value={meta.icon ?? ""}
                onChange={(event) =>
                  onUpdateGroup({ icon: event.target.value || null })
                }
                placeholder="Ex.: pizza, cup-soda"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.required}
                onChange={(event) =>
                  onUpdateGroup({ required: event.target.checked })
                }
              />
              Obrigatório
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.allow_repeat ?? false}
                onChange={(event) =>
                  onUpdateGroup({ allow_repeat: event.target.checked })
                }
              />
              Permite repetição
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.allow_quantity ?? false}
                onChange={(event) =>
                  onUpdateGroup({ allow_quantity: event.target.checked })
                }
              />
              Permite quantidade
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.hidden ?? false}
                onChange={(event) =>
                  onUpdateGroup({ hidden: event.target.checked })
                }
              />
              Oculto
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.is_premium ?? false}
                onChange={(event) =>
                  onUpdateGroup({ is_premium: event.target.checked })
                }
              />
              <Sparkles size={14} />
              Premium
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={meta.is_recommended ?? false}
                onChange={(event) =>
                  onUpdateGroup({ is_recommended: event.target.checked })
                }
              />
              Recomendado
            </label>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Opções</p>
            <SortableList
              items={group.options}
              getKey={(option) => option.id}
              onReorder={onReorderOptions}
              emptyMessage="Cadastre opções em Itens de Opções ou duplique de outro grupo."
              renderItem={(option) => (
                <OptionEditor
                  option={option}
                  allowQuantity={meta.allow_quantity ?? false}
                  onChange={(patch) => onUpdateOption(option.id, patch)}
                />
              )}
            />
          </div>
        </div>
      )}
    </section>
  );
}
