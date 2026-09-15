import type {
  ScaleConnectionConfig,
  ScaleDriverCapability,
  ScaleWeightReading,
} from "../../types.js";
import {
  ScaleProtocolUnavailableError,
  type ScaleDriver,
} from "../ScaleDriver.js";

/**
 * Driver placeholder for manufacturers whose protocol/SDK is not in the repo.
 * Does not invent weights or fake success.
 */
export function createUnimplementedScaleDriver(
  capability: ScaleDriverCapability
): ScaleDriver {
  let connected = false;
  let lastConfig: ScaleConnectionConfig | null = null;

  return {
    capability,
    async connect(config) {
      lastConfig = config;
      connected = true;
      // Connection metadata accepted; protocol I/O remains blocked.
    },
    async disconnect() {
      connected = false;
      lastConfig = null;
    },
    isConnected() {
      return connected;
    },
    async readWeight(): Promise<ScaleWeightReading> {
      throw new ScaleProtocolUnavailableError(
        capability.manufacturer,
        capability.notes
      );
    },
    async zero() {
      throw new ScaleProtocolUnavailableError(
        capability.manufacturer,
        capability.notes
      );
    },
    async tare() {
      throw new ScaleProtocolUnavailableError(
        capability.manufacturer,
        capability.notes
      );
    },
    async testCommunication() {
      return {
        ok: false,
        detail:
          `Porta configurada: ${lastConfig?.port ?? "—"}. ` +
          `Protocolo ${capability.label} ainda depende de documentação/SDK do fabricante. ` +
          capability.notes,
      };
    },
  };
}
