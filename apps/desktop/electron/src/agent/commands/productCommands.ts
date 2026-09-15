import { REMOTE_COMMANDS } from "../../shared/remoteCommands.js";
import { BaseCommand } from "../BaseCommand.js";
import { operationsRepository } from "../repository/operations.repository.js";
import type { CommandContext } from "../types.js";

export class PauseProductCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.PAUSE_PRODUCT;

  async run({ record }: CommandContext) {
    const productId = String(record.payload.productId ?? "");
    return operationsRepository.setProductStatus(productId, "inactive");
  }
}

export class ActivateProductCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.ACTIVATE_PRODUCT;

  async run({ record }: CommandContext) {
    const productId = String(record.payload.productId ?? "");
    return operationsRepository.setProductStatus(productId, "active");
  }
}

export class PauseOptionCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.PAUSE_OPTION;

  async run({ record }: CommandContext) {
    const optionId = String(record.payload.optionId ?? "");
    return operationsRepository.setOptionActive(optionId, false);
  }
}

export class ActivateOptionCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.ACTIVATE_OPTION;

  async run({ record }: CommandContext) {
    const optionId = String(record.payload.optionId ?? "");
    return operationsRepository.setOptionActive(optionId, true);
  }
}

export class UpdateStockCommand extends BaseCommand {
  readonly command = REMOTE_COMMANDS.UPDATE_STOCK;

  async run({ record, organizationId }: CommandContext) {
    return operationsRepository.updateStock(record.payload, organizationId);
  }
}
