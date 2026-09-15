import { emitAutomationEvent } from "@/lib/automation-events";
import { getDesktopApi } from "@/desktop/types";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";
import { summaryBuilder } from "@/features/product-engine/core/SummaryBuilder";
import { finalizeSale } from "../repository/pdv.repository";
import type { FinalizeSaleDTO, FinalizeSaleResult } from "../types/sale";
import type { CartItem } from "../types/cart";
import { mapCartUnitsToRpcComponents } from "../utils/comboCartUnits";

function buildSaleObservation(cartObservation: string, items: CartItem[]) {
  const itemNotes = items
    .filter(
      (item) => item.selectedOptions.length > 0 || item.observation.trim()
    )
    .map((item) => {
      const summaryText = item.summaries?.customer.lines.join(" · ");
      if (summaryText) return summaryText;

      const options = item.selectedOptions
        .map((option) => `${option.groupName}: ${option.optionName}`)
        .join(", ");
      const parts = [item.product.name];

      if (options) parts.push(`[${options}]`);
      if (item.observation.trim()) parts.push(`(${item.observation.trim()})`);

      return parts.join(" ");
    });

  return [cartObservation.trim(), ...itemNotes].filter(Boolean).join("\n");
}

function buildPrintLines(
  cartItems: CartItem[],
  result: FinalizeSaleResult,
  cartObservation: string
) {
  const lines = [
    `Venda #${result.sale_number}`,
    new Date().toLocaleString("pt-BR"),
    "",
  ];

  for (const item of cartItems) {
    if (item.summaries) {
      lines.push(...summaryBuilder.toPrintLines(item.summaries));
    } else {
      lines.push(`${item.quantity}x ${item.product.name}`);
    }
    lines.push("");
  }

  lines.push(`Total: R$ ${Number(result.total).toFixed(2)}`);

  if (cartObservation.trim()) {
    lines.push("", `Obs: ${cartObservation.trim()}`);
  }

  return lines;
}

async function dispatchPrint(input: {
  organizationId?: string | null;
  cartItems: CartItem[];
  result: FinalizeSaleResult;
  cartObservation: string;
}) {
  const lines = buildPrintLines(input.cartItems, input.result, input.cartObservation);
  const desktopApi = getDesktopApi();

  if (desktopApi) {
    await desktopApi.enqueuePrint({
      type: "order",
      title: `Venda #${input.result.sale_number}`,
      lines,
    });
  }

  if (input.organizationId) {
    await remoteCommandsService.dispatchPrintOrder({
      organizationId: input.organizationId,
      saleId: input.result.id,
      saleNumber: input.result.sale_number,
      lines,
      title: `Venda #${input.result.sale_number}`,
    });
  }
}

export const pdvService = {
  async finalizeSaleFromCart(
    cartItems: CartItem[],
    paymentMethod: FinalizeSaleDTO["payment_method"],
    paymentAmount: number,
    discount = 0,
    observation?: string,
    customerId?: string | null,
    organizationId?: string | null
  ) {
    const items = cartItems.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      options: item.selectedOptions.map((option) => ({
        option_id: option.optionId,
        quantity: option.quantity ?? 1,
      })),
      ...(item.comboComponents && item.comboComponents.length > 0
        ? {
            components: mapCartUnitsToRpcComponents(item.comboComponents),
          }
        : {}),
    }));

    const result = await finalizeSale({
      items,
      payment_method: paymentMethod,
      payment_amount: paymentAmount,
      discount,
      observation: buildSaleObservation(observation ?? "", cartItems),
      customer_id: customerId ?? null,
    });

    emitAutomationEvent("SALE_COMPLETED", {
      module: "pdv",
      saleId: result.id,
      saleNumber: result.sale_number,
      total: result.total,
      subtotal: result.subtotal,
      discount: result.discount,
      paymentMethod: result.payment_method,
      customerId: customerId ?? null,
      entityId: result.id,
      entityType: "sale",
    });

    emitAutomationEvent("PAYMENT_RECEIVED", {
      module: "finance",
      saleId: result.id,
      amount: result.payment_amount,
      paymentMethod: result.payment_method,
      total: result.total,
      entityId: result.id,
      entityType: "payment",
    });

    for (const item of cartItems) {
      for (const option of item.selectedOptions) {
        emitAutomationEvent("STOCK_CHANGED", {
          module: "inventory",
          optionId: option.optionId,
          optionName: option.optionName,
          quantity: (option.quantity ?? 1) * item.quantity,
          entityId: option.optionId,
          entityType: "option",
        });
      }
    }

    await dispatchPrint({
      organizationId,
      cartItems,
      result,
      cartObservation: observation ?? "",
    }).catch((error) => {
      console.warn("Falha ao despachar impressão:", error);
    });

    return result;
  },
};
