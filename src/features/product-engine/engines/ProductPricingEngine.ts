import type {
  EngineBuildState,
  EnginePricingResult,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";
import { applyMaxFreeAllowance } from "../utils/maxFreePricing";

export interface PricingPromotion {
  id: string;
  label: string;
  amount: number;
}

export class ProductPricingEngine {
  calculate(
    node: EngineProductNode,
    selections: Record<string, EngineSelectionItem[]>,
    quantity = 1,
    promotions: PricingPromotion[] = []
  ): EnginePricingResult {
    const basePrice = node.basePrice;
    let addonsTotal = 0;
    let premiumTotal = 0;
    const breakdown: EnginePricingResult["breakdown"] = [
      { label: "Preço base", amount: basePrice, kind: "base" },
    ];

    for (const group of node.groups) {
      const groupSelections = selections[group.id] ?? [];
      if (groupSelections.length === 0) continue;

      const chargedLines = applyMaxFreeAllowance(group, groupSelections);

      for (const line of chargedLines) {
        if (line.freeQuantity > 0) {
          breakdown.push({
            label:
              line.freeQuantity === line.item.quantity
                ? `${line.item.optionName} (grátis)`
                : `${line.item.optionName} (${line.freeQuantity} grátis)`,
            amount: 0,
            kind: line.item.premium ? "premium" : "addon",
          });
        }

        if (line.chargedQuantity <= 0 || line.chargedAmount <= 0) continue;

        if (line.item.premium) {
          premiumTotal += line.chargedAmount;
          breakdown.push({
            label: `${line.item.optionName} (premium)`,
            amount: line.chargedAmount,
            kind: "premium",
          });
        } else {
          addonsTotal += line.chargedAmount;
          breakdown.push({
            label: line.item.optionName,
            amount: line.chargedAmount,
            kind: "addon",
          });
        }
      }
    }

    const subtotal = (basePrice + addonsTotal + premiumTotal) * quantity;
    const discountsTotal = promotions.reduce((sum, promo) => sum + promo.amount, 0);

    for (const promo of promotions) {
      breakdown.push({
        label: promo.label,
        amount: -promo.amount,
        kind: "discount",
      });
    }

    return {
      basePrice,
      addonsTotal,
      premiumTotal,
      quantity,
      subtotal,
      discountsTotal,
      total: Math.max(0, subtotal - discountsTotal),
      breakdown,
    };
  }

  calculateFromBuildState(
    node: EngineProductNode,
    state: EngineBuildState,
    promotions: PricingPromotion[] = []
  ) {
    return this.calculate(node, state.selections, 1, promotions);
  }
}

export const productPricingEngine = new ProductPricingEngine();
