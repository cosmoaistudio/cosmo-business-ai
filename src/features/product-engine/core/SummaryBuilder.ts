import type {
  EngineBuildState,
  EnginePrintSummary,
  EngineProductNode,
} from "../types/productEngine.types";
import { productSummary } from "./ProductSummary";

export type SummaryChannel = "print" | "kitchen" | "customer";

export interface SummaryBundle {
  print: EnginePrintSummary;
  kitchen: EnginePrintSummary;
  customer: EnginePrintSummary;
}

export class SummaryBuilder {
  build(
    node: EngineProductNode,
    state: EngineBuildState,
    quantity = 1
  ): SummaryBundle {
    const base = productSummary.generate(node, state, quantity);

    return {
      print: this.forPrint(base, node, quantity),
      kitchen: this.forKitchen(base, node, state, quantity),
      customer: this.forCustomer(base, node, state, quantity),
    };
  }

  forPrint(
    base: EnginePrintSummary,
    node: EngineProductNode,
    quantity: number
  ): EnginePrintSummary {
    return {
      productName: node.productName,
      lines: [
        "=== CUPOM / IMPRESSÃO ===",
        ...base.lines,
        `Total item: R$ ${base.total.toFixed(2)}`,
        quantity > 1 ? `Quantidade pedido: ${quantity}` : "",
      ].filter(Boolean),
      total: base.total,
      observation: base.observation,
    };
  }

  forKitchen(
    base: EnginePrintSummary,
    node: EngineProductNode,
    state: EngineBuildState,
    quantity: number
  ): EnginePrintSummary {
    const prepLines: string[] = [];

    for (const group of node.groups) {
      const selections = state.selections[group.id] ?? [];
      for (const item of selections) {
        const option = node.optionsByGroupId[group.id]?.find(
          (entry) => entry.id === item.optionId
        );
        if (option && option.weight > 0) {
          prepLines.push(`Peso ${option.name}: ${option.weight}g`);
        }
      }
    }

    return {
      productName: node.productName,
      lines: [
        "=== COZINHA / PRODUÇÃO ===",
        `${quantity}x ${node.productName}`,
        ...base.lines.filter((line) => line.trim().startsWith("-")),
        ...(base.observation ? [`OBS: ${base.observation}`] : []),
        ...prepLines,
      ],
      total: base.total,
      observation: base.observation,
    };
  }

  forCustomer(
    base: EnginePrintSummary,
    node: EngineProductNode,
    state: EngineBuildState,
    quantity: number
  ): EnginePrintSummary {
    return {
      productName: node.productName,
      lines: [
        "Seu pedido:",
        `${quantity}x ${node.productName}`,
        ...Object.values(state.selections)
          .flat()
          .map((item) => `• ${item.optionName}`),
        ...(base.observation ? [`Observação: ${base.observation}`] : []),
        `Total: R$ ${base.total.toFixed(2)}`,
      ],
      total: base.total,
      observation: base.observation,
    };
  }

  toPrintLines(bundle: SummaryBundle): string[] {
    return bundle.print.lines;
  }

  toKitchenLines(bundle: SummaryBundle): string[] {
    return bundle.kitchen.lines;
  }

  toCustomerLines(bundle: SummaryBundle): string[] {
    return bundle.customer.lines;
  }
}

export const summaryBuilder = new SummaryBuilder();
