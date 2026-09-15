import type { Product } from "@/features/products";
import type { CompositionSelection } from "./compositionValidation";

export function calculateUnitPrice(
  product: Product,
  selections: CompositionSelection[]
) {
  const optionsTotal = selections.reduce(
    (sum, selection) => sum + selection.option.price,
    0
  );

  return Number(product.price) + optionsTotal;
}

export function buildCartItemSignature(input: {
  productId: string;
  selectedOptionIds: string[];
  observation: string;
  /** Optional qty map: optionId -> quantity (defaults to 1). */
  selectedOptionQuantities?: Record<string, number>;
  /** Nested combo slots: componentId + sorted option keys */
  comboComponentKeys?: string[];
}) {
  const optionKey = [...input.selectedOptionIds]
    .sort()
    .map((id) => {
      const qty = input.selectedOptionQuantities?.[id] ?? 1;
      return qty > 1 ? `${id}x${qty}` : id;
    })
    .join("|");

  const comboKey = [...(input.comboComponentKeys ?? [])].sort().join("||");

  return `${input.productId}::${optionKey}::${comboKey}::${input.observation.trim()}`;
}
