import { REMOTE_COMMANDS } from "../../shared/remoteCommands.js";
import { BaseCommand } from "../BaseCommand.js";
import { cashDrawerService } from "../../services/cashDrawerService.js";
import { operationsRepository } from "../repository/operations.repository.js";
import type { CommandContext } from "../types.js";

export class OpenDrawerCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.OPEN_DRAWER;

  async run() {
    await cashDrawerService.open();
    return { ok: true };
  }
}

export class OpenCashRegisterCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.OPEN_CASH_REGISTER;

  async run({ record, organizationId }: CommandContext) {
    return operationsRepository.openCashRegister(record.payload, organizationId);
  }
}

export class CloseCashRegisterCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.CLOSE_CASH_REGISTER;

  async run({ record, organizationId }: CommandContext) {
    return operationsRepository.closeCashRegister(record.payload, organizationId);
  }
}
