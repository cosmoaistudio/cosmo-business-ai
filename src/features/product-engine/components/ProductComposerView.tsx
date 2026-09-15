import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type {
  EngineProductGroup,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";
import { isOptionAvailable } from "../utils/availabilityFilter";
import { getFreeAllowanceUsage } from "../utils/maxFreePricing";

interface ProductComposerViewProps {
  productName: string;
  basePrice?: number;
  loading: boolean;
  blocked: boolean;
  blockedReason?: string | null;
  node: EngineProductNode | null;
  selections: Record<string, EngineSelectionItem[]>;
  quantity: number;
  observation: string;
  validationErrors: string[];
  unitPrice: number;
  lineTotal: number;
  onToggleOption: (groupId: string, optionId: string) => void;
  onOptionQuantityChange: (
    groupId: string,
    optionId: string,
    quantity: number
  ) => void;
  onQuantityChange: (quantity: number) => void;
  onObservationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  maxQuantity?: number;
}

function selectedQty(
  selections: EngineSelectionItem[],
  optionId: string
): number {
  return (
    selections.find((item) => item.optionId === optionId)?.quantity ?? 0
  );
}

function groupSelectedCount(selections: EngineSelectionItem[]): number {
  return selections.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function GroupSection({
  group,
  options,
  selections,
  search,
  onToggleOption,
  onOptionQuantityChange,
}: {
  group: EngineProductGroup;
  options: EngineProductNode["optionsByGroupId"][string];
  selections: EngineSelectionItem[];
  search: string;
  onToggleOption: (groupId: string, optionId: string) => void;
  onOptionQuantityChange: (
    groupId: string,
    optionId: string,
    quantity: number
  ) => void;
}) {
  const singleChoice =
    group.selectionType === "radio" || group.maxSelection <= 1;
  const selectedCount = groupSelectedCount(selections);
  const freeUsage = getFreeAllowanceUsage(group, selections);
  const giftBlocksExcess = group.type === "gift" && freeUsage.maxFree > 0;

  const filtered = options.filter((option) =>
    option.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{group.name}</h3>
        {group.required && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Obrigatório
          </span>
        )}
        <span className="text-xs text-slate-500">
          {group.minSelection > 0
            ? `Escolha pelo menos ${group.minSelection}`
            : "Opcional"}
          {" · "}
          Máx. {group.maxSelection}
        </span>
        {freeUsage.maxFree > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              freeUsage.remaining > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {freeUsage.used}/{freeUsage.maxFree} grátis
            {giftBlocksExcess
              ? " · limite"
              : freeUsage.totalSelected > freeUsage.maxFree
                ? " · extras pagos"
                : ""}
          </span>
        )}
      </div>

      {group.minSelection > 0 && selectedCount < group.minSelection && (
        <p className="mb-3 text-sm font-medium text-amber-700">
          Escolha pelo menos {group.minSelection}
        </p>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma opção encontrada.</p>
        )}

        {filtered.map((option) => {
          const qty = selectedQty(selections, option.id);
          const selected = qty > 0;
          const disabled = !isOptionAvailable(option);
          const hardMax = giftBlocksExcess
            ? Math.min(group.maxSelection, freeUsage.maxFree)
            : group.maxSelection;
          const groupAtLimit = selectedCount >= hardMax;
          const plusDisabled =
            disabled ||
            groupAtLimit ||
            (singleChoice && selected && !group.allowsQuantity);

          return (
            <div
              key={option.id}
              className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                selected
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              } ${disabled ? "opacity-55" : ""}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (singleChoice) {
                    onToggleOption(group.id, option.id);
                    return;
                  }
                  if (!selected) onOptionQuantityChange(group.id, option.id, 1);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{option.name}</p>
                    {disabled && (
                      <p className="mt-0.5 text-xs font-medium text-amber-700">
                        Indisponível
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-blue-700">
                    {option.price > 0
                      ? `+ ${formatCurrency(option.price)}`
                      : "Incluso"}
                  </span>
                </div>
              </button>

              {!singleChoice || group.allowsQuantity ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Diminuir ${option.name}`}
                    disabled={disabled || qty <= 0}
                    onClick={() =>
                      onOptionQuantityChange(group.id, option.id, qty - 1)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-40"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center text-base font-bold text-slate-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Aumentar ${option.name}`}
                    disabled={plusDisabled}
                    onClick={() =>
                      onOptionQuantityChange(group.id, option.id, qty + 1)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleOption(group.id, option.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-700"
                  }`}
                >
                  {selected ? "Selecionado" : "Escolher"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function ProductComposerView({
  productName,
  basePrice,
  loading,
  blocked,
  blockedReason,
  node,
  selections,
  quantity,
  observation,
  validationErrors,
  unitPrice,
  lineTotal,
  onToggleOption,
  onOptionQuantityChange,
  onQuantityChange,
  onObservationChange,
  onConfirm,
  onCancel,
  confirmLabel = "Adicionar ao carrinho",
  maxQuantity = 99,
}: ProductComposerViewProps) {
  const [search, setSearch] = useState("");

  const addonLines = useMemo(() => {
    return Object.values(selections)
      .flat()
      .filter((item) => item.quantity > 0);
  }, [selections]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          </div>
        ) : blocked ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {blockedReason ?? "Produto indisponível para venda."}
          </div>
        ) : (
          <div className="space-y-5">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar adicional..."
                className="w-full bg-transparent text-base outline-none"
              />
            </label>

            {node?.groups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                options={node.optionsByGroupId[group.id] ?? []}
                selections={selections[group.id] ?? []}
                search={search}
                onToggleOption={onToggleOption}
                onOptionQuantityChange={onOptionQuantityChange}
              />
            ))}

            {validationErrors.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {validationErrors[0]}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Quantidade do item
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border"
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  >
                    <Minus size={18} />
                  </button>
                  <span className="min-w-10 text-center text-xl font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border"
                    onClick={() =>
                      onQuantityChange(Math.min(maxQuantity, quantity + 1))
                    }
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Observações
                </label>
                <input
                  value={observation}
                  onChange={(event) => onObservationChange(event.target.value)}
                  placeholder="Ex.: sem cebola..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-5">
        <div className="mb-4 max-h-36 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between font-medium text-slate-800">
            <span>{productName}</span>
            <span>
              {formatCurrency(basePrice ?? unitPrice - addonLines.reduce(
                (s, i) => s + i.unitPrice * i.quantity,
                0
              ))}
            </span>
          </div>
          {addonLines.map((line) => (
            <div
              key={`${line.groupId}-${line.optionId}`}
              className="flex justify-between text-slate-600"
            >
              <span>
                {line.quantity > 1 ? `${line.quantity}× ` : ""}
                {line.optionName}
              </span>
              <span>
                {line.unitPrice > 0
                  ? `+ ${formatCurrency(line.unitPrice * line.quantity)}`
                  : "Incluso"}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-black text-blue-600">
            <span>Total</span>
            <span>{formatCurrency(lineTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading || blocked || validationErrors.length > 0}
            onClick={onConfirm}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
