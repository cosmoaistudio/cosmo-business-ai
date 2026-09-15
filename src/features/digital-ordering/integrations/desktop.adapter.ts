import { getDesktopApi } from "@/desktop/types";
import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";
import type { DigitalPlacedOrder } from "../types/digitalOrdering.types";

export async function notifyDesktopNewDigitalOrder(order: DigitalPlacedOrder) {
  const desktopApi = getDesktopApi();
  const title = `Pedido Digital #${order.saleNumber}`;
  const lines = [
    title,
    `Modo: ${order.context.mode}`,
    order.context.tableLabel ? `Mesa: ${order.context.tableLabel}` : "",
    `Total: R$ ${order.total.toFixed(2)}`,
  ].filter(Boolean);

  if (desktopApi) {
    await desktopApi.enqueuePrint({
      type: "order",
      title,
      lines,
    });
  }

  await remoteCommandsService.dispatchPrintOrder({
    organizationId: order.organizationId,
    saleId: order.id,
    saleNumber: order.saleNumber,
    lines,
    title,
  }).catch(() => undefined);
}
