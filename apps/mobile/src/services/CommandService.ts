import {
  REMOTE_COMMANDS,
  type DispatchRemoteCommandInput,
  type ProductCommandPayload,
  type RemoteCommandRecord,
  type RemoteCommandType,
  type UpdateStockPayload,
} from "@cosmo/remote-commands";
import {
  broadcastRemoteCommand,
  createRemoteCommand,
  listRemoteCommands,
  subscribeToRemoteCommands,
} from "./repositories/remoteCommand.repository";

export class CommandService {
  async dispatch(input: DispatchRemoteCommandInput) {
    const command = await createRemoteCommand({
      organizationId: input.organizationId,
      command: input.command,
      payload: input.payload,
      source: input.source ?? "mobile",
      expiresInMinutes: input.expiresInMinutes,
    });

    await broadcastRemoteCommand(input.organizationId, command).catch(() => {
      // Persistência garante entrega; broadcast acelera.
    });

    return command;
  }

  async dispatchTyped(
    organizationId: string,
    command: RemoteCommandType,
    payload: Record<string, unknown> = {}
  ) {
    return this.dispatch({ organizationId, command, payload });
  }

  printOrder(organizationId: string, payload: Record<string, unknown> = {}) {
    return this.dispatchTyped(organizationId, REMOTE_COMMANDS.PRINT_ORDER, payload);
  }

  openDrawer(organizationId: string) {
    return this.dispatchTyped(organizationId, REMOTE_COMMANDS.OPEN_DRAWER, {});
  }

  closeCashRegister(organizationId: string, payload: Record<string, unknown> = {}) {
    return this.dispatchTyped(
      organizationId,
      REMOTE_COMMANDS.CLOSE_CASH_REGISTER,
      payload
    );
  }

  pauseProduct(organizationId: string, payload: ProductCommandPayload) {
    return this.dispatchTyped(
      organizationId,
      REMOTE_COMMANDS.PAUSE_PRODUCT,
      payload as unknown as Record<string, unknown>
    );
  }

  activateProduct(organizationId: string, payload: ProductCommandPayload) {
    return this.dispatchTyped(
      organizationId,
      REMOTE_COMMANDS.ACTIVATE_PRODUCT,
      payload as unknown as Record<string, unknown>
    );
  }

  updateStock(organizationId: string, payload: UpdateStockPayload) {
    return this.dispatchTyped(
      organizationId,
      REMOTE_COMMANDS.UPDATE_STOCK,
      payload as unknown as Record<string, unknown>
    );
  }

  runBackup(organizationId: string) {
    return this.dispatchTyped(organizationId, REMOTE_COMMANDS.RUN_BACKUP, {});
  }

  listHistory(organizationId: string, limit?: number) {
    return listRemoteCommands(organizationId, limit);
  }

  subscribe(
    organizationId: string,
    onChange: (command: RemoteCommandRecord) => void
  ) {
    return subscribeToRemoteCommands(organizationId, onChange);
  }
}

export const commandService = new CommandService();
