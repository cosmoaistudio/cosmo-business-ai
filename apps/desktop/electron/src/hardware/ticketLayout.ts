/**
 * Layout de ticket térmico 80mm (texto ESC/POS).
 * Logo/QR: linhas de placeholder até raster/QR ESC/POS serem ligados.
 */

export interface Ticket80mmInput {
  kind?: "receipt" | "order";
  title?: string;
  companyName?: string;
  logoHint?: string;
  orderNumber?: string;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    weightKg?: number;
  }>;
  subtotal: number;
  total: number;
  pixKey?: string;
  qrHint?: string;
  openDrawer?: boolean;
  printedAt?: string;
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildTicket80mmLines(input: Ticket80mmInput): string[] {
  const lines: string[] = [];
  const at = input.printedAt ?? new Date().toLocaleString("pt-BR");

  if (input.logoHint) lines.push(`[LOGO] ${input.logoHint}`);
  if (input.companyName) lines.push(input.companyName.toUpperCase());
  lines.push("--------------------------------");
  lines.push(input.title ?? "PEDIDO");
  if (input.orderNumber) lines.push(`Pedido: ${input.orderNumber}`);
  lines.push(`Horario: ${at}`);
  lines.push("--------------------------------");

  for (const item of input.items) {
    const weight =
      item.weightKg != null ? ` ${item.weightKg.toFixed(3)} kg` : "";
    lines.push(`${item.qty}x ${item.name}${weight}`);
    lines.push(`   ${money(item.unitPrice * item.qty)}`);
  }

  lines.push("--------------------------------");
  lines.push(`Subtotal: ${money(input.subtotal)}`);
  lines.push(`TOTAL: ${money(input.total)}`);

  if (input.pixKey) {
    lines.push("--------------------------------");
    lines.push("PIX");
    lines.push(input.pixKey);
  }

  if (input.qrHint) {
    lines.push(`[QR] ${input.qrHint}`);
  }

  lines.push("--------------------------------");
  lines.push("Obrigado · Cosmo Business");

  return lines;
}
