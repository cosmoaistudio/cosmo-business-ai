import type {
  ScaleConnectionConfig,
  ScaleDriverCapability,
  ScaleWeightReading,
} from "../types.js";

export interface ScaleDriver {
  readonly capability: ScaleDriverCapability;
  connect(config: ScaleConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  readWeight(): Promise<ScaleWeightReading>;
  zero(): Promise<void>;
  tare(): Promise<void>;
  testCommunication(): Promise<{ ok: boolean; detail: string }>;
}

export class ScaleProtocolUnavailableError extends Error {
  constructor(manufacturer: string, detail: string) {
    super(
      `[${manufacturer}] Protocolo não disponível nesta build. ${detail}`
    );
    this.name = "ScaleProtocolUnavailableError";
  }
}
