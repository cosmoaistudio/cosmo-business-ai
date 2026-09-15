import type {
  EngineProductGroup,
  EngineSelectionItem,
} from "../types/productEngine.types";

export interface ChargedSelectionLine {
  item: EngineSelectionItem;
  /** Quantity charged at unitPrice (after free allowance) */
  chargedQuantity: number;
  /** Quantity covered by max_free */
  freeQuantity: number;
  chargedAmount: number;
}

/**
 * Apply group.maxFree across selected units (cheapest first).
 * Does not mutate input. Excess beyond maxFree remains chargeable
 * when maxSelection allows it (block vs paid is enforced by rules/validator).
 */
export function applyMaxFreeAllowance(
  group: EngineProductGroup,
  selections: EngineSelectionItem[]
): ChargedSelectionLine[] {
  if (selections.length === 0) return [];

  if (group.maxFree <= 0) {
    return selections.map((item) => ({
      item,
      chargedQuantity: item.quantity,
      freeQuantity: 0,
      chargedAmount: item.unitPrice * item.quantity,
    }));
  }

  type Unit = { optionId: string; unitPrice: number; premium: boolean };
  const units: Unit[] = [];
  for (const item of selections) {
    for (let i = 0; i < item.quantity; i += 1) {
      units.push({
        optionId: item.optionId,
        unitPrice: item.unitPrice,
        premium: Boolean(item.premium),
      });
    }
  }

  units.sort((a, b) => a.unitPrice - b.unitPrice);

  const freeByOption = new Map<string, number>();
  const chargedByOption = new Map<string, number>();
  let freeLeft = group.maxFree;

  for (const unit of units) {
    if (freeLeft > 0) {
      freeByOption.set(
        unit.optionId,
        (freeByOption.get(unit.optionId) ?? 0) + 1
      );
      freeLeft -= 1;
    } else {
      chargedByOption.set(
        unit.optionId,
        (chargedByOption.get(unit.optionId) ?? 0) + 1
      );
    }
  }

  return selections.map((item) => {
    const freeQuantity = freeByOption.get(item.optionId) ?? 0;
    const chargedQuantity = chargedByOption.get(item.optionId) ?? 0;
    return {
      item,
      chargedQuantity,
      freeQuantity,
      chargedAmount: item.unitPrice * chargedQuantity,
    };
  });
}

export function getFreeAllowanceUsage(
  group: EngineProductGroup,
  selections: EngineSelectionItem[]
): { used: number; maxFree: number; remaining: number; totalSelected: number } {
  const totalSelected = selections.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const maxFree = Math.max(0, group.maxFree);
  const used = Math.min(totalSelected, maxFree);
  return {
    used,
    maxFree,
    remaining: Math.max(0, maxFree - used),
    totalSelected,
  };
}
