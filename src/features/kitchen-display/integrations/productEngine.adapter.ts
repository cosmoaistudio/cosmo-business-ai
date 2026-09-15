import type { KitchenTicket, KitchenTicketItem } from "../types/kitchenDisplay.types";

export interface KitchenLine {
  text: string;
  kind: "product" | "option" | "note";
}

/**
 * Renderiza ticket KDS. Combos com summary multilinha (COPO N — produto)
 * preservam quebras sem prefixar "+ " em linhas que já são cabeçalho/opção.
 */
export function formatKitchenLinesFromTicket(ticket: KitchenTicket): KitchenLine[] {
  const lines: KitchenLine[] = [];

  for (const item of ticket.items) {
    lines.push({
      kind: "product",
      text: `${item.quantity}x ${item.productName}`,
    });

    const summary = item.summary?.trim();
    if (!summary) continue;

    const summaryLines = summary.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const looksLikeComboUnits = summaryLines.some((line) =>
      /^COPO\s+\d+/i.test(line)
    );

    if (looksLikeComboUnits) {
      for (const line of summaryLines) {
        if (/^COPO\s+\d+/i.test(line)) {
          lines.push({ kind: "product", text: line });
        } else {
          const text = line.startsWith("+") ? line : `+ ${line}`;
          lines.push({ kind: "option", text });
        }
      }
    } else {
      lines.push({
        kind: "option",
        text: summary.startsWith("+") ? summary : `+ ${summary}`,
      });
    }
  }

  if (ticket.notes?.trim()) {
    lines.push({ kind: "note", text: `Obs: ${ticket.notes.trim()}` });
  }

  return lines;
}

export function summarizeKitchenItem(item: KitchenTicketItem) {
  return item.summary?.trim()
    ? `${item.productName} (${item.summary.trim()})`
    : item.productName;
}
