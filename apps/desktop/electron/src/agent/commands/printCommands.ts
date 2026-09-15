import { REMOTE_COMMANDS } from "../../shared/remoteCommands.js";
import { BaseCommand } from "../BaseCommand.js";
import { operationsRepository } from "../repository/operations.repository.js";
import { printerService } from "../../printer/printerService.js";
import type { CommandContext } from "../types.js";

export class PrintOrderCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.PRINT_ORDER;

  async run({ record }: CommandContext) {
    const lines = await operationsRepository.resolveOrderLines(record.payload);
    const job = await printerService.printOrder({
      type: "order",
      title: String(record.payload.title ?? "PEDIDO"),
      lines,
    });

    return { ok: true, data: { jobId: job.id } };
  }
}

export class ReprintOrderCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.REPRINT_ORDER;

  async run({ record }: CommandContext) {
    const lines = await operationsRepository.resolveOrderLines(record.payload);
    const job = await printerService.printOrder({
      type: "order",
      title: `REIMPRESSÃO · ${String(record.payload.title ?? "PEDIDO")}`,
      lines,
    });

    return { ok: true, data: { jobId: job.id, reprint: true } };
  }
}
