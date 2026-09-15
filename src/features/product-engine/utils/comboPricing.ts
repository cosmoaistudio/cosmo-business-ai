import type { CartSelectedOption } from "@/features/pdv/types/cart";
import { applyMaxFreeAllowance } from "./maxFreePricing";
import type {
  EngineProductGroup,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";

export interface ComboComponentPriceInput {
  componentId: string;
  /** Slot quantity from product_combo_components.quantity */
  slotQuantity: number;
  node: EngineProductNode | null;
  selections: Record<string, EngineSelectionItem[]>;
  allowConfiguration: boolean;
}

/**
 * Paid addons for one component slot (respects max_free of the child).
 * Child base price is NEVER included — combo has its own base.
 */
export function calculateComponentAddonsTotal(
  input: ComboComponentPriceInput
): number {
  if (!input.allowConfiguration || !input.node) return 0;

  let addons = 0;
  for (const group of input.node.groups) {
    const selections = input.selections[group.id] ?? [];
    if (selections.length === 0) continue;
    const lines = applyMaxFreeAllowance(group, selections);
    for (const line of lines) {
      addons += line.chargedAmount;
    }
  }

  return addons * Math.max(1, input.slotQuantity);
}

export function calculateComboUnitPrice(
  comboBasePrice: number,
  components: ComboComponentPriceInput[]
): number {
  const addons = components.reduce(
    (sum, component) => sum + calculateComponentAddonsTotal(component),
    0
  );
  return Math.max(0, comboBasePrice + addons);
}

export function selectionsToCartOptions(
  node: EngineProductNode,
  selections: Record<string, EngineSelectionItem[]>
): CartSelectedOption[] {
  const options: CartSelectedOption[] = [];
  for (const group of node.groups) {
    for (const item of selections[group.id] ?? []) {
      options.push({
        optionId: item.optionId,
        optionName: item.optionName,
        groupId: group.id,
        groupName: group.name,
        price: item.unitPrice,
        quantity: item.quantity,
      });
    }
  }
  return options;
}

/** Effective chargeable unit price for display of an option under max_free. */
export function estimateOptionChargeHint(
  group: EngineProductGroup,
  selections: EngineSelectionItem[],
  optionId: string,
  optionPrice: number
): "free" | "paid" | "mixed" {
  if (group.maxFree <= 0) return optionPrice > 0 ? "paid" : "free";
  const lines = applyMaxFreeAllowance(group, selections);
  const line = lines.find((entry) => entry.item.optionId === optionId);
  if (!line) return optionPrice > 0 ? "paid" : "free";
  if (line.chargedQuantity <= 0) return "free";
  if (line.freeQuantity > 0) return "mixed";
  return "paid";
}
