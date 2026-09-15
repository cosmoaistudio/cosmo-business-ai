import { openDrawerCommand, sendToNetworkPrinter, sendToSpooler } from "../printer/escpos.js";

export class CashDrawerService {
  private host = process.env.COSMO_PRINTER_HOST ?? "";
  private port = Number(process.env.COSMO_PRINTER_PORT ?? 9100);

  async open() {
    const buffer = openDrawerCommand();

    if (this.host) {
      await sendToNetworkPrinter(buffer, this.host, this.port);
      return;
    }

    await sendToSpooler(buffer, "open-drawer");
  }
}

export const cashDrawerService = new CashDrawerService();
