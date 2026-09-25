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

export type ProductComposerVisualTone = "default" | "digital";

export interface ProductComposerViewProps {
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
  /**
   * `digital` uses MenuTheme CSS vars (--digital-*) for public Pedido Digital.
   * Default keeps the PDV slate/blue look unchanged.
   */
  visualTone?: ProductComposerVisualTone;
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

function toneClasses(tone: ProductComposerVisualTone) {
  if (tone === "digital") {
    return {
      group: "rounded-[var(--digital-radius-card)] border border-[var(--digital-border)] bg-[var(--digital-surface)] p-4",
      groupTitle:
        "text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--digital-muted)]",
      groupMeta: "text-xs text-[var(--digital-muted)]",
      optionIdle:
        "border-[var(--digital-border)] hover:border-[var(--digital-primary)]",
      optionSelected:
        "border-[var(--digital-primary)] bg-[color-mix(in_srgb,var(--digital-primary)_18%,transparent)] shadow-[0_0_0_1px_var(--digital-primary)]",
      optionName: "font-semibold text-[var(--digital-text)]",
      optionPrice: "shrink-0 text-sm font-bold text-[var(--digital-primary)]",
      qtyBtn:
        "digital-focus-ring digital-motion-press flex h-11 w-11 items-center justify-center rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] bg-[var(--digital-bg)] text-[var(--digital-text)] disabled:opacity-40",
      qtyValue: "w-8 text-center text-base font-bold text-[var(--digital-text)]",
      chooseIdle:
        "digital-focus-ring digital-motion-press rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] px-4 py-2 text-sm font-semibold text-[var(--digital-text)]",
      chooseSelected:
        "digital-focus-ring digital-motion-press rounded-[var(--digital-radius-button)] bg-[var(--digital-primary)] px-4 py-2 text-sm font-semibold text-white",
      search:
        "flex items-center gap-3 rounded-[var(--digital-radius-card)] border border-[var(--digital-border)] bg-[var(--digital-surface)] px-4 py-3",
      searchIcon: "text-[var(--digital-muted)]",
      searchInput:
        "w-full bg-transparent text-base text-[var(--digital-text)] outline-none placeholder:text-[var(--digital-muted)]",
      label: "mb-2 block text-sm font-medium text-[var(--digital-muted)]",
      obsInput:
        "digital-focus-ring w-full rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] bg-[var(--digital-surface)] px-4 py-3 text-[var(--digital-text)]",
      footer:
        "sticky bottom-0 border-t border-[var(--digital-border)] bg-[var(--digital-bg)] px-6 py-5",
      summary:
        "mb-4 max-h-36 space-y-2 overflow-y-auto rounded-[var(--digital-radius-card)] border border-[var(--digital-border)] bg-[var(--digital-surface)] px-4 py-3 text-sm",
      summaryTitle: "flex justify-between font-medium text-[var(--digital-text)]",
      summaryLine: "flex justify-between text-[var(--digital-muted)]",
      summaryTotal:
        "flex justify-between border-t border-[var(--digital-border)] pt-2 text-base font-black text-[var(--digital-primary)]",
      cancel:
        "digital-focus-ring digital-motion-press rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] px-5 py-3 text-sm font-semibold text-[var(--digital-text)]",
      confirm:
        "digital-focus-ring digital-motion-press rounded-[var(--digital-radius-button)] bg-[var(--digital-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50",
      spinner: "h-7 w-7 animate-spin text-[var(--digital-muted)] digital-spin",
      empty: "text-sm text-[var(--digital-muted)]",
    };
  }

  return {
    group: "rounded-2xl border border-slate-200 p-4",
    groupTitle: "text-base font-semibold text-slate-900",
    groupMeta: "text-xs text-slate-500",
    optionIdle: "border-slate-200 hover:border-slate-300",
    optionSelected: "border-blue-400 bg-blue-50",
    optionName: "font-semibold text-slate-900",
    optionPrice: "shrink-0 text-sm font-bold text-blue-700",
    qtyBtn:
      "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 disabled:opacity-40",
    qtyValue: "w-8 text-center text-base font-bold text-slate-900",
    chooseIdle:
      "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700",
    chooseSelected: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white",
    search: "flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3",
    searchIcon: "text-slate-400",
    searchInput: "w-full bg-transparent text-base outline-none",
    label: "mb-2 block text-sm font-medium text-slate-700",
    obsInput: "w-full rounded-xl border border-slate-200 px-4 py-3",
    footer: "sticky bottom-0 border-t border-slate-100 bg-white px-6 py-5",
    summary:
      "mb-4 max-h-36 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 px-4 py-3 text-sm",
    summaryTitle: "flex justify-between font-medium text-slate-800",
    summaryLine: "flex justify-between text-slate-600",
    summaryTotal:
      "flex justify-between border-t border-slate-200 pt-2 text-base font-black text-blue-600",
    cancel:
      "rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700",
    confirm:
      "rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50",
    spinner: "h-7 w-7 animate-spin text-slate-400",
    empty: "text-sm text-slate-500",
  };
}

function GroupSection({
  group,
  options,
  selections,
  search,
  tone,
  onToggleOption,
  onOptionQuantityChange,
}: {
  group: EngineProductGroup;
  options: EngineProductNode["optionsByGroupId"][string];
  selections: EngineSelectionItem[];
  search: string;
  tone: ProductComposerVisualTone;
  onToggleOption: (groupId: string, optionId: string) => void;
  onOptionQuantityChange: (
    groupId: string,
    optionId: string,
    quantity: number
  ) => void;
}) {
  const cx = toneClasses(tone);
  const singleChoice =
    group.selectionType === "radio" || group.maxSelection <= 1;
  const selectedCount = groupSelectedCount(selections);
  const freeUsage = getFreeAllowanceUsage(group, selections);
  const giftBlocksExcess = group.type === "gift" && freeUsage.maxFree > 0;

  const filtered = options.filter((option) =>
    option.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className={cx.group}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className={cx.groupTitle}>{group.name}</h3>
        {group.required && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Obrigatório
          </span>
        )}
        <span className={cx.groupMeta}>
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
          <p className={cx.empty}>Nenhuma opção encontrada.</p>
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
              className={`flex items-center gap-3 rounded-[inherit] border px-3 py-3 transition ${
                selected ? cx.optionSelected : cx.optionIdle
              } ${disabled ? "opacity-55" : ""}`}
              style={
                tone === "digital"
                  ? { borderRadius: "var(--digital-radius-card)" }
                  : undefined
              }
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
                    <p className={cx.optionName}>{option.name}</p>
                    {disabled && (
                      <p className="mt-0.5 text-xs font-medium text-amber-700">
                        Indisponível
                      </p>
                    )}
                  </div>
                  <span className={cx.optionPrice}>
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
                    className={cx.qtyBtn}
                  >
                    <Minus size={18} />
                  </button>
                  <span className={cx.qtyValue}>{qty}</span>
                  <button
                    type="button"
                    aria-label={`Aumentar ${option.name}`}
                    disabled={plusDisabled}
                    onClick={() =>
                      onOptionQuantityChange(group.id, option.id, qty + 1)
                    }
                    className={cx.qtyBtn}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleOption(group.id, option.id)}
                  className={selected ? cx.chooseSelected : cx.chooseIdle}
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
  visualTone = "default",
}: ProductComposerViewProps) {
  const [search, setSearch] = useState("");
  const cx = toneClasses(visualTone);

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
            <Loader2 className={cx.spinner} />
          </div>
        ) : blocked ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {blockedReason ?? "Produto indisponível para venda."}
          </div>
        ) : (
          <div className="space-y-5">
            <label className={cx.search}>
              <Search size={18} className={cx.searchIcon} aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar adicional..."
                aria-label="Buscar adicional"
                className={cx.searchInput}
              />
            </label>

            {node?.groups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                options={node.optionsByGroupId[group.id] ?? []}
                selections={selections[group.id] ?? []}
                search={search}
                tone={visualTone}
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
                <label className={cx.label} htmlFor="composer-item-qty">
                  Quantidade do item
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="composer-item-qty"
                    aria-label="Diminuir quantidade"
                    className={
                      visualTone === "digital"
                        ? "digital-focus-ring digital-motion-press flex h-12 w-12 items-center justify-center rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] text-[var(--digital-text)]"
                        : "flex h-12 w-12 items-center justify-center rounded-xl border"
                    }
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  >
                    <Minus size={18} />
                  </button>
                  <span
                    className={
                      visualTone === "digital"
                        ? "min-w-10 text-center text-xl font-bold text-[var(--digital-text)]"
                        : "min-w-10 text-center text-xl font-bold"
                    }
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    className={
                      visualTone === "digital"
                        ? "digital-focus-ring digital-motion-press flex h-12 w-12 items-center justify-center rounded-[var(--digital-radius-button)] border border-[var(--digital-border)] text-[var(--digital-text)]"
                        : "flex h-12 w-12 items-center justify-center rounded-xl border"
                    }
                    onClick={() =>
                      onQuantityChange(Math.min(maxQuantity, quantity + 1))
                    }
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className={cx.label} htmlFor="composer-observation">
                  Observações
                </label>
                <input
                  id="composer-observation"
                  value={observation}
                  onChange={(event) => onObservationChange(event.target.value)}
                  placeholder="Ex.: sem cebola..."
                  className={cx.obsInput}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cx.footer}>
        <div className={cx.summary}>
          <div className={cx.summaryTitle}>
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
              className={cx.summaryLine}
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
          <div className={cx.summaryTotal}>
            <span>Total</span>
            <span>{formatCurrency(lineTotal)}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={cx.cancel}>
            Cancelar
          </button>

          <button
            type="button"
            disabled={loading || blocked || validationErrors.length > 0}
            onClick={onConfirm}
            className={cx.confirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
