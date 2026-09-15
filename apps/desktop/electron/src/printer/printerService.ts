import type { PrintJobPayload } from "../ipc/channels.js";
import { resolveDriver } from "./drivers/index.js";
import {
  buildEscPosBuffer,
  sendToNetworkPrinter,
  sendToSpooler,
} from "./escpos.js";
import { printQueue, type QueuedPrintJob } from "./printQueue.js";

export class PrinterService {
  private defaultHost = process.env.COSMO_PRINTER_HOST ?? "";
  private defaultPort = Number(process.env.COSMO_PRINTER_PORT ?? 9100);
  private defaultDriver = process.env.COSMO_PRINTER_DRIVER ?? "generic";

  async initialize(userDataPath: string) {
    await printQueue.initialize(userDataPath, (job) => this.processJob(job));
  }

  async printReceipt(payload: PrintJobPayload) {
    return printQueue.enqueue({
      ...payload,
      type: "receipt",
    });
  }

  async printOrder(payload: PrintJobPayload) {
    return printQueue.enqueue({
      ...payload,
      type: "order",
    });
  }

  getQueueSize() {
    return printQueue.size();
  }

  getQueue() {
    return printQueue.getAll();
  }

  async shutdown() {
    await printQueue.shutdown();
  }

  private async processJob(job: QueuedPrintJob) {
    const driver = resolveDriver(job.driver ?? this.defaultDriver);
    const lines = [
      job.title ?? (job.type === "order" ? "PEDIDO" : "RECIBO"),
      "--------------------------------",
      ...job.lines,
      "--------------------------------",
      `Cosmo Desktop · ${new Date().toLocaleString("pt-BR")}`,
    ];

    const buffer = driver.build({
      lines,
      cut: true,
      openDrawer: job.openDrawer,
    });

    const host = job.host ?? this.defaultHost;

    if (host) {
      await sendToNetworkPrinter(buffer, host, job.port ?? this.defaultPort);
      return;
    }

    await sendToSpooler(buffer, `${job.type}-${job.id}`);
  }

  buildPreview(payload: PrintJobPayload) {
    const driver = resolveDriver(payload.driver ?? this.defaultDriver);
    return buildEscPosBuffer(
      {
        lines: payload.lines,
        cut: true,
        openDrawer: payload.openDrawer,
      },
      driver.id
    );
  }
}

export const printerService = new PrinterService();
