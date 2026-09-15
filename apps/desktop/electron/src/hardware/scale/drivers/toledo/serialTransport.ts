import type { ScaleConnectionConfig } from "../../../types.js";
import { PRT5_SERIAL_DEFAULTS } from "./protocol/prt5.js";

type SerialPortInstance = {
  isOpen: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  write(data: Buffer): Promise<number>;
  on(event: "data", listener: (chunk: Buffer) => void): void;
  on(event: "error", listener: (error: Error) => void): void;
  removeAllListeners(event?: string): void;
};

/**
 * Transporte serial para o driver Toledo.
 * Usa `serialport` quando instalado; não inventa I/O.
 */
export class ToledoSerialTransport {
  private port: SerialPortInstance | null = null;
  private buffer = Buffer.alloc(0);

  get isOpen() {
    return Boolean(this.port?.isOpen);
  }

  async open(config: ScaleConnectionConfig) {
    if (this.port?.isOpen) {
      await this.close();
    }

    let SerialPortCtor: new (options: Record<string, unknown>) => SerialPortInstance;
    try {
      const mod = await import("serialport");
      SerialPortCtor = mod.SerialPort as unknown as typeof SerialPortCtor;
    } catch {
      throw new Error(
        "Pacote `serialport` ausente. Instale com `npm i serialport` e rode rebuild do Electron para abrir a COM da Prix 3 Fit."
      );
    }

    const baudRate = config.baudRate || PRT5_SERIAL_DEFAULTS.baudRate;
    const dataBits = config.dataBits || PRT5_SERIAL_DEFAULTS.dataBits;
    const stopBits = config.stopBits || PRT5_SERIAL_DEFAULTS.stopBits;
    const parity = config.parity || PRT5_SERIAL_DEFAULTS.parity;

    this.port = new SerialPortCtor({
      path: config.port,
      baudRate,
      dataBits,
      stopBits,
      parity,
      autoOpen: false,
    });

    this.buffer = Buffer.alloc(0);
    this.port.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
    });

    await this.port.open();
  }

  async close() {
    if (!this.port) return;
    this.port.removeAllListeners("data");
    this.port.removeAllListeners("error");
    if (this.port.isOpen) {
      await this.port.close();
    }
    this.port = null;
    this.buffer = Buffer.alloc(0);
  }

  clearBuffer() {
    this.buffer = Buffer.alloc(0);
  }

  async write(data: Buffer) {
    if (!this.port?.isOpen) {
      throw new Error("Porta serial Toledo não está aberta");
    }
    await this.port.write(data);
  }

  /**
   * Aguarda até `predicate` aceitar o buffer ou timeout.
   */
  async waitFor(
    predicate: (buf: Buffer) => boolean,
    timeoutMs = 2000
  ): Promise<Buffer> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (predicate(this.buffer)) {
        const snapshot = Buffer.from(this.buffer);
        return snapshot;
      }
      await sleep(20);
    }
    throw new Error(
      `Timeout aguardando resposta Prt5 da balança (${timeoutMs} ms). Buffer=${this.buffer.toString("hex") || "vazio"}`
    );
  }

  takeBuffer() {
    const snapshot = Buffer.from(this.buffer);
    this.buffer = Buffer.alloc(0);
    return snapshot;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
