import type {
  ScaleConnectionConfig,
  ScaleDriverCapability,
  ScaleWeightReading,
} from "../../../types.js";
import {
  ScaleProtocolUnavailableError,
  type ScaleDriver,
} from "../../ScaleDriver.js";
import {
  PRT5,
  PRT5_COMMAND_COVERAGE,
  PRT5_SERIAL_DEFAULTS,
  buildEnqCommand,
  buildPrePackToggleCommand,
  buildSetPricePerKgCommand,
  buildSetTareGramsCommand,
  parseAckNack,
  parseWeightResponse,
} from "./protocol/prt5.js";
import { ToledoSerialTransport } from "./serialTransport.js";

export const TOLEDO_PRIX3_FIT_CAPABILITY: ScaleDriverCapability = {
  manufacturer: "toledo",
  label: "Toledo Prix 3 Fit / Fit/2 (Prt5)",
  models: ["Prix 3 Fit", "Prix 3 Fit/2"],
  protocolImplemented: true,
  notes:
    "Protocolo oficial Prt5 (manual MU-3-Fit §5.3.4). Requer serialport + C14=Prt5. Sem simulação de peso.",
};

export class ToledoPrix3FitDriver implements ScaleDriver {
  readonly capability = TOLEDO_PRIX3_FIT_CAPABILITY;
  private readonly transport = new ToledoSerialTransport();
  private config: ScaleConnectionConfig | null = null;

  async connect(config: ScaleConnectionConfig): Promise<void> {
    const merged: ScaleConnectionConfig = {
      ...config,
      manufacturer: "toledo",
      baudRate: config.baudRate || PRT5_SERIAL_DEFAULTS.baudRate,
      dataBits: config.dataBits || PRT5_SERIAL_DEFAULTS.dataBits,
      parity: config.parity || PRT5_SERIAL_DEFAULTS.parity,
      stopBits: config.stopBits || PRT5_SERIAL_DEFAULTS.stopBits,
    };
    this.config = merged;
    await this.transport.open(merged);
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
    this.config = null;
  }

  isConnected(): boolean {
    return this.transport.isOpen;
  }

  async readWeight(): Promise<ScaleWeightReading> {
    this.assertConnected();
    this.transport.clearBuffer();
    await this.transport.write(buildEnqCommand());

    const buffer = await this.transport.waitFor((buf) => {
      const stx = buf.indexOf(PRT5.STX);
      const etx = stx >= 0 ? buf.indexOf(PRT5.ETX, stx + 1) : -1;
      return stx >= 0 && etx > stx;
    });

    const frame = parseWeightResponse(buffer);
    this.transport.takeBuffer();

    if (frame.status === "unstable") {
      throw new Error(
        "Balança reportou peso instável (IIIII) — protocolo Prt5 oficial"
      );
    }
    if (frame.status === "negative") {
      throw new Error(
        "Balança reportou peso negativo (NNNNN) — protocolo Prt5 oficial"
      );
    }
    if (frame.status === "overload") {
      throw new Error(
        "Balança reportou sobrecarga (SSSSS) — protocolo Prt5 oficial"
      );
    }
    if (frame.kg == null) {
      throw new Error("Resposta de peso estável sem valor numérico");
    }

    return {
      kg: frame.kg,
      stable: true,
      raw: frame.rawField,
      source: "toledo",
    };
  }

  async zero(): Promise<void> {
    throw new ScaleProtocolUnavailableError(
      "toledo",
      PRT5_COMMAND_COVERAGE.notInOfficialSerialProtocol[0].reason
    );
  }

  async tare(): Promise<void> {
    throw new ScaleProtocolUnavailableError(
      "toledo",
      `${PRT5_COMMAND_COVERAGE.notInOfficialSerialProtocol[1].reason} Use setTareGrams(g).`
    );
  }

  /** Comando oficial: [SOH][TARA][ETX] */
  async setTareGrams(grams: number): Promise<void> {
    this.assertConnected();
    this.transport.clearBuffer();
    await this.transport.write(buildSetTareGramsCommand(grams));
    await this.expectAck("setTareGrams");
  }

  /** Comando oficial: [STX][PPPPPP][ETX] */
  async setPricePerKg(priceBrl: number): Promise<void> {
    this.assertConnected();
    this.transport.clearBuffer();
    await this.transport.write(buildSetPricePerKgCommand(priceBrl));
    await this.expectAck("setPricePerKg");
  }

  /** Comando oficial: [DC4] */
  async togglePrePack(): Promise<"on" | "off"> {
    this.assertConnected();
    this.transport.clearBuffer();
    await this.transport.write(buildPrePackToggleCommand());
    const buffer = await this.transport.waitFor(
      (buf) => buf.includes(PRT5.SO) || buf.includes(PRT5.SI)
    );
    this.transport.takeBuffer();
    if (buffer.includes(PRT5.SO)) return "on";
    if (buffer.includes(PRT5.SI)) return "off";
    throw new Error("Resposta de pré-empacotamento inválida (esperado SO/SI)");
  }

  async testCommunication(): Promise<{ ok: boolean; detail: string }> {
    try {
      this.assertConnected();
      this.transport.clearBuffer();
      await this.transport.write(buildEnqCommand());
      const buffer = await this.transport.waitFor((buf) => {
        const stx = buf.indexOf(PRT5.STX);
        const etx = stx >= 0 ? buf.indexOf(PRT5.ETX, stx + 1) : -1;
        return stx >= 0 && etx > stx;
      });
      const frame = parseWeightResponse(buffer);
      this.transport.takeBuffer();
      return {
        ok: true,
        detail: `Prt5 OK · status=${frame.status} · campo=${frame.rawField} · porta=${this.config?.port ?? "—"}`,
      };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getOfficialCommandCoverage() {
    return PRT5_COMMAND_COVERAGE;
  }

  private assertConnected() {
    if (!this.transport.isOpen) {
      throw new Error(
        "Driver Toledo Prix 3 Fit não conectado. Chame connect() com a porta COM."
      );
    }
  }

  private async expectAck(op: string) {
    const buffer = await this.transport.waitFor(
      (buf) =>
        buf.includes(PRT5.ACK) || buf.includes(PRT5.NACK)
    );
    const byte = buffer.includes(PRT5.ACK)
      ? PRT5.ACK
      : buffer.includes(PRT5.NACK)
        ? PRT5.NACK
        : -1;
    this.transport.takeBuffer();
    const result = parseAckNack(byte);
    if (result === "ack") return;
    if (result === "nack") {
      throw new Error(`Balança respondeu NACK (21H) em ${op} — manual Prt5`);
    }
    throw new Error(`Sem ACK/NACK em ${op}`);
  }
}

export const toledoPrix3FitDriver = new ToledoPrix3FitDriver();
