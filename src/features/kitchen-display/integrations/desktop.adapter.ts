import { remoteCommandsService } from "@/features/remote-commands/remoteCommands.service";
import type { KitchenStatus } from "../types/kitchenDisplay.types";
import { KITCHEN_STATUS_LABELS } from "../types/kitchenDisplay.types";

export async function notifyDesktopKitchenUpdate(
  organizationId: string,
  saleNumber: number,
  status: KitchenStatus
) {
  try {
    await remoteCommandsService.dispatchPrintOrder({
      organizationId,
      saleId: `kitchen-${saleNumber}`,
      saleNumber,
      title: `KDS #${saleNumber} — ${KITCHEN_STATUS_LABELS[status]}`,
      lines: [`Status: ${KITCHEN_STATUS_LABELS[status]}`, new Date().toLocaleString("pt-BR")],
    });
  } catch {
    // Desktop offline — KDS continua operando
  }
}
