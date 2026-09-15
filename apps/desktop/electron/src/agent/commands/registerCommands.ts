import { commandRegistry } from "../CommandRegistry.js";
import {
  ActivateOptionCommand,
  ActivateProductCommand,
  PauseOptionCommand,
  PauseProductCommand,
  UpdateStockCommand,
} from "./productCommands.js";
import {
  CloseCashRegisterCommand,
  OpenCashRegisterCommand,
  OpenDrawerCommand,
} from "./cashCommands.js";
import { PrintOrderCommand, ReprintOrderCommand } from "./printCommands.js";
import { RestartPrinterCommand, RunBackupCommand } from "./systemCommands.js";

export function registerAllCommands() {
  commandRegistry.registerMany([
    new PrintOrderCommand(),
    new ReprintOrderCommand(),
    new OpenDrawerCommand(),
    new OpenCashRegisterCommand(),
    new CloseCashRegisterCommand(),
    new PauseProductCommand(),
    new ActivateProductCommand(),
    new PauseOptionCommand(),
    new ActivateOptionCommand(),
    new UpdateStockCommand(),
    new RunBackupCommand(),
    new RestartPrinterCommand(),
  ]);
}
