import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  OptionGroupStatusBadge,
  OptionGroupTypeBadge,
} from "@/features/product-composition";
import { ProductThumbnail } from "@/features/products";
import { formatCurrency } from "@/lib/format";
import { resolveOptionImage } from "@/features/product-composition/utils/optionImage";
import {
  isOptionDisabled,
  toggleOptionSelection,
} from "@/features/pdv/utils/compositionValidation";
import type { Product } from "@/features/products/types/product";
import type { ProductOptionGroupWithOptions } from "@/features/product-composition/types/productComposition";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import type { BuilderGroupState } from "../types/builder";
import {
  calculatePreviewPricing,
  validateBuilderState,
} from "../utils/builderEngineBridge";

export type PreviewMode = "pdv" | "menu";

interface CompositionPreviewPanelProps {
  mode: PreviewMode;
  product: Product;
  linkedGroups: BuilderGroupState[];
  engineNode: EngineProductNode | null;
  previewSelections: Record<string, string[]>;
  onPreviewSelectionsChange: (selections: Record<string, string[]>) => void;
}

function toPreviewGroups(
  linkedGroups: BuilderGroupState[]
): ProductOptionGroupWithOptions[] {
  return linkedGroups
    .filter((group) => !group.group.hidden)
    .map((group, index) => ({
      id: group.linkId ?? group.groupId,
      product_id: "",
      group_id: group.groupId,
      sort_order: index,
      created_at: group.group.created_at,
      option_groups: group.group,
      options: group.options.filter((option) => option.active),
    }));
}

export default function CompositionPreviewPanel({
  mode,
  product,
  linkedGroups,
  engineNode,
  previewSelections,
  onPreviewSelectionsChange,
}: CompositionPreviewPanelProps) {
  const groups = useMemo(
    () => toPreviewGroups(linkedGroups),
    [linkedGroups]
  );

  const displayMap = useMemo(
    () => new Map(linkedGroups.map((group) => [group.groupId, group.display])),
    [linkedGroups]
  );

  const [observation, setObservation] = useState("");

  const validation = useMemo(() => {
    if (!engineNode) return null;

    return validateBuilderState({
      productForm: {
        name: product.name,
        category: product.category,
        price: String(product.price),
        description: product.description,
        status: product.status,
        image_url: product.image_url ?? "",
        sku: "",
      },
      previewGroups: linkedGroups,
      previewSelections,
      engineNode,
    });
  }, [engineNode, linkedGroups, previewSelections, product]);

  const pricing = useMemo(() => {
    if (!engineNode) return null;
    return calculatePreviewPricing(
      engineNode,
      linkedGroups,
      previewSelections
    );
  }, [engineNode, linkedGroups, previewSelections]);

  const allowObservation = linkedGroups.some(
    (group) => group.display.allowObservation
  );

  function handleToggleOption(
    group: ProductOptionGroupWithOptions,
    optionId: string
  ) {
    const meta = group.option_groups;
    if (!meta) return;

    onPreviewSelectionsChange({
      ...previewSelections,
      [meta.id]: toggleOptionSelection(
        group,
        previewSelections[meta.id] ?? [],
        optionId
      ),
    });
  }

  const isMenu = mode === "menu";
  const unitPrice = pricing?.total ?? Number(product.price);

  return (
    <div
      className={`overflow-hidden rounded-3xl border shadow-sm ${
        isMenu
          ? "border-orange-200 bg-gradient-to-b from-orange-50 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`px-5 py-4 ${
          isMenu ? "bg-orange-500 text-white" : "bg-slate-900 text-white"
        }`}
      >
        <p className="text-xs uppercase tracking-wide opacity-80">
          {isMenu ? "Cardápio Digital" : "Experiência do Cliente"}
        </p>
        <h3 className="text-lg font-bold">{product.name}</h3>
        <p className="mt-1 text-sm opacity-90">
          {formatCurrency(Number(product.price))} + opções
        </p>
      </div>

      <div className="space-y-4 p-5">
        {isMenu && (
          <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-white p-4">
            <ProductThumbnail product={product} size="md" />
            <div>
              <p className="font-semibold text-slate-900">{product.name}</p>
              {product.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {product.description}
                </p>
              )}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            Adicione grupos no construtor para visualizar o preview.
          </p>
        )}

        {groups.map((group) => {
          const meta = group.option_groups;
          if (!meta) return null;

          const display = displayMap.get(meta.id);
          const selectedIds = previewSelections[meta.id] ?? [];
          const displayStyle = meta.display_style ?? "list";

          return (
            <section
              key={group.id}
              className="rounded-2xl border border-slate-200 p-4"
              style={{
                borderColor: meta.color ?? undefined,
              }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-slate-900">{meta.name}</h4>
                <OptionGroupStatusBadge required={meta.required} />
                <OptionGroupTypeBadge selectionType={meta.selection_type} />
                {meta.is_recommended && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    Recomendado
                  </span>
                )}
              </div>

              {display?.showDescription && meta.description && (
                <p className="mb-3 text-sm text-slate-500">{meta.description}</p>
              )}

              <div
                className={
                  displayStyle === "grid" || displayStyle === "cards"
                    ? "grid gap-2 sm:grid-cols-2"
                    : displayStyle === "chips"
                      ? "flex flex-wrap gap-2"
                      : "space-y-2"
                }
              >
                {group.options.map((option) => {
                  const checked = selectedIds.includes(option.id);
                  const disabled = isOptionDisabled(
                    group,
                    selectedIds,
                    option
                  );
                  const imageUrl = resolveOptionImage(option);

                  const itemClass =
                    displayStyle === "chips"
                      ? `inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200"
                        } ${disabled ? "opacity-50" : ""}`
                      : `flex items-start gap-3 rounded-xl border px-3 py-3 ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200"
                        } ${disabled ? "opacity-50" : ""}`;

                  return (
                    <label key={option.id} className={itemClass}>
                      <input
                        type={
                          meta.selection_type === "radio"
                            ? "radio"
                            : "checkbox"
                        }
                        name={`preview-${mode}-${meta.id}`}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => handleToggleOption(group, option.id)}
                        className="mt-1"
                      />

                      {display?.showImage && displayStyle !== "chips" && (
                        <div className="shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={option.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            {option.name}
                            {option.is_featured && (
                              <span className="ml-2 text-xs text-amber-600">
                                ★
                              </span>
                            )}
                          </p>
                          {display?.showPrice && (
                            <span className="text-sm font-semibold text-blue-700">
                              {option.price > 0
                                ? `+ ${formatCurrency(option.price)}`
                                : "Incluso"}
                            </span>
                          )}
                        </div>
                        {display?.showDescription && option.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}

        {allowObservation && (
          <textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Observações do pedido..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
        )}

        {validation && !validation.previewValidation.valid && (
          <div className="space-y-1">
            {validation.previewValidation.errors.map((error) => (
              <p
                key={error}
                className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                {error}
              </p>
            ))}
          </div>
        )}

        {pricing && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              ProductPricingEngine
            </p>
            {pricing.breakdown.map((line) => (
              <div
                key={`${line.label}-${line.amount}`}
                className="flex justify-between text-sm text-slate-600"
              >
                <span>{line.label}</span>
                <span>{formatCurrency(line.amount)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-sm font-medium text-slate-700">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(unitPrice)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
