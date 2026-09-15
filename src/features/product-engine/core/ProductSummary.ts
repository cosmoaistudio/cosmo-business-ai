import { productPricingEngine } from "../engines/ProductPricingEngine";
import type {
  EngineBuildState,
  EnginePrintSummary,
  EngineProductNode,
} from "../types/productEngine.types";

export class ProductSummary {
  generate(
    node: EngineProductNode,
    state: EngineBuildState,
    quantity = 1
  ): EnginePrintSummary {
    const pricing = productPricingEngine.calculateFromBuildState(node, state);
    const lines: string[] = [`${node.productName}`];

    for (const group of node.groups) {
      const selections = state.selections[group.id] ?? [];
      if (selections.length === 0) continue;

      lines.push(`  ${group.name}:`);
      for (const item of selections) {
        const priceLabel =
          item.unitPrice > 0 ? ` (+R$ ${item.unitPrice.toFixed(2)})` : "";
        const qtyLabel = item.quantity > 1 ? ` x${item.quantity}` : "";
        lines.push(`    - ${item.optionName}${qtyLabel}${priceLabel}`);
      }
    }

    if (state.observation.trim()) {
      lines.push(`  Obs: ${state.observation.trim()}`);
    }

    lines.push(`  Qtd: ${quantity}`);
    lines.push(`  Total: R$ ${(pricing.total * quantity).toFixed(2)}`);

    return {
      productName: node.productName,
      lines,
      total: pricing.total * quantity,
      observation: state.observation.trim() || undefined,
    };
  }

  toReceiptText(summary: EnginePrintSummary) {
    return summary.lines.join("\n");
  }
}

export const productSummary = new ProductSummary();
