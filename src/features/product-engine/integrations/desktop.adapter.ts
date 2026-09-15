import type { EnginePrintSummary } from "../types/productEngine.types";

export interface DesktopReceiptBlock {
  header: string;
  body: string[];
  footer: string;
}

export function toDesktopReceipt(summary: EnginePrintSummary): DesktopReceiptBlock {
  return {
    header: summary.productName,
    body: summary.lines,
    footer: `Total: R$ ${summary.total.toFixed(2)}`,
  };
}
