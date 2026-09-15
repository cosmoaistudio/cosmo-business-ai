/**
 * Protocolo oficial Toledo Prix 3 Fit / Fit/2 — Prt5
 * Fonte: Manual do Usuário MU-3-Fit (Toledo do Brasil), seção 5.3.4
 * https://www.toledobrasil.com/wp-content/uploads/2024/08/MU-3-Fit-10-25-Rev.16.pdf
 *
 * Não altera nem estende o protocolo. Apenas codifica/decodifica o documentado.
 */

export const PRT5 = {
  STX: 0x02,
  ETX: 0x03,
  ENQ: 0x05,
  ACK: 0x06,
  /** Manual lista NACK como 21H (não o NACK ASCII clássico 15H). */
  NACK: 0x21,
  SOH: 0x01,
  DC4: 0x14,
  SO: 0x0e,
  SI: 0x0f,
} as const;

/** Defaults oficiais do manual para serial/Bluetooth Prt5. */
export const PRT5_SERIAL_DEFAULTS = {
  baudRate: 115_200,
  dataBits: 8 as const,
  parity: "none" as const,
  stopBits: 1 as const,
};

export type Prt5WeightStatus =
  | "stable"
  | "unstable"
  | "negative"
  | "overload";

export interface Prt5WeightFrame {
  status: Prt5WeightStatus;
  /** kg quando status === stable; caso contrário null */
  kg: number | null;
  rawField: string;
}

export function buildEnqCommand(): Buffer {
  return Buffer.from([PRT5.ENQ]);
}

/** [STX][PPPPPP][ETX] — preço/kg com 4 inteiros + 2 decimais. */
export function buildSetPricePerKgCommand(priceBrl: number): Buffer {
  if (!Number.isFinite(priceBrl) || priceBrl < 0) {
    throw new Error("Preço/kg inválido para comando oficial Prt5");
  }
  const cents = Math.round(priceBrl * 100);
  const field = String(cents).padStart(6, "0").slice(-6);
  return Buffer.from([PRT5.STX, ...Buffer.from(field, "ascii"), PRT5.ETX]);
}

/**
 * [SOH][TARA][ETX] — tara em gramas, 6 dígitos ASCII (manual: ex. 360g → 000360).
 */
export function buildSetTareGramsCommand(tareGrams: number): Buffer {
  if (!Number.isFinite(tareGrams) || tareGrams < 0) {
    throw new Error("Tara (g) inválida para comando oficial Prt5");
  }
  const field = String(Math.round(tareGrams)).padStart(6, "0").slice(-6);
  return Buffer.from([PRT5.SOH, ...Buffer.from(field, "ascii"), PRT5.ETX]);
}

export function buildPrePackToggleCommand(): Buffer {
  return Buffer.from([PRT5.DC4]);
}

export function parseAckNack(byte: number): "ack" | "nack" | "unknown" {
  if (byte === PRT5.ACK) return "ack";
  if (byte === PRT5.NACK) return "nack";
  return "unknown";
}

/**
 * Extrai o primeiro frame [STX]…[ETX] do buffer.
 * Campo de peso Prt5: 5 caracteres.
 */
export function extractStxEtxField(
  buffer: Buffer,
  expectedLen: number
): { field: string; endIndex: number } | null {
  const stx = buffer.indexOf(PRT5.STX);
  if (stx < 0) return null;
  const etx = buffer.indexOf(PRT5.ETX, stx + 1);
  if (etx < 0) return null;
  const field = buffer.subarray(stx + 1, etx).toString("ascii");
  if (field.length !== expectedLen) {
    return null;
  }
  return { field, endIndex: etx };
}

export function parseWeightField(field: string): Prt5WeightFrame {
  const trimmed = field.replace(/\s/g, "");
  if (trimmed === "IIIII" || field === "IIIII") {
    return { status: "unstable", kg: null, rawField: field };
  }
  if (trimmed === "NNNNN" || field === "NNNNN") {
    return { status: "negative", kg: null, rawField: field };
  }
  if (trimmed === "SSSSS" || field === "SSSSS") {
    return { status: "overload", kg: null, rawField: field };
  }
  if (!/^\d{5}$/.test(field)) {
    throw new Error(
      `Campo de peso Prt5 inválido (esperado 5 dígitos ou IIIII/NNNNN/SSSSS): "${field}"`
    );
  }
  // Manual: 2 dígitos inteiros + 3 decimais (ex.: 14385 → 14,385 kg)
  const kg = Number(field.slice(0, 2) + "." + field.slice(2));
  return { status: "stable", kg, rawField: field };
}

export function parseWeightResponse(buffer: Buffer): Prt5WeightFrame {
  const extracted = extractStxEtxField(buffer, 5);
  if (!extracted) {
    throw new Error(
      "Resposta Prt5 sem frame [STX][ppppp][ETX] (manual §5.3.4 Obtendo o PESO)"
    );
  }
  return parseWeightField(extracted.field);
}

/** Comandos oficiais Prt5 e cobertura neste driver. */
export const PRT5_COMMAND_COVERAGE = {
  implemented: [
    {
      name: "Obter peso",
      hostToScale: "[ENQ] (05H)",
      scaleToHost: "[STX][ppppp|IIIII|NNNNN|SSSSS][ETX]",
      method: "readWeight() / testCommunication()",
    },
    {
      name: "Informar preço/kg",
      hostToScale: "[STX][PPPPPP][ETX]",
      scaleToHost: "[ACK] (06H) | [NACK] (21H)",
      method: "setPricePerKg(priceBrl)",
    },
    {
      name: "Informar tara (g)",
      hostToScale: "[SOH][TARA 6 dígitos][ETX]",
      scaleToHost: "[ACK] (06H) | [NACK] (21H)",
      method: "setTareGrams(grams)",
    },
    {
      name: "Pré-empacotamento on/off",
      hostToScale: "[DC4] (14H)",
      scaleToHost: "[SO] (0EH) | [SI] (0FH)",
      method: "togglePrePack()",
    },
  ],
  notInOfficialSerialProtocol: [
    {
      name: "Zerar (zero)",
      reason:
        "Manual MU-3-Fit Prt5 não documenta comando serial de zeramento. Zeramento é função da balança (tecla/automático).",
      method: "zero() → erro explícito",
    },
    {
      name: "Tara sem valor",
      reason:
        "Comando oficial exige campo TARA em gramas ([SOH][TTTTTT][ETX]). Interface tare() sem parâmetro não mapeia 1:1.",
      method: "tare() → erro; use setTareGrams(g)",
    },
  ],
  scaleConfigRequired: [
    "C14 = Prt5 (ou Prt3 para leitura ENQ compatível)",
    "C13 = SERIAL quando usar RS-232/conversor (versões com C13)",
    "Serial app: 115200 8N1 (manual § Bluetooth/serial Prt5)",
  ],
} as const;
