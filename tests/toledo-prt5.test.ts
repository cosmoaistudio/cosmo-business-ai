import { describe, expect, it } from "vitest";
import {
  buildEnqCommand,
  buildSetPricePerKgCommand,
  buildSetTareGramsCommand,
  parseWeightField,
  parseWeightResponse,
  PRT5,
} from "../apps/desktop/electron/src/hardware/scale/drivers/toledo/protocol/prt5";

describe("Toledo Prt5 (oficial MU-3-Fit)", () => {
  it("monta ENQ 05H", () => {
    expect(buildEnqCommand().equals(Buffer.from([0x05]))).toBe(true);
  });

  it("monta preço/kg 16,58 como no manual", () => {
    const cmd = buildSetPricePerKgCommand(16.58);
    expect(cmd[0]).toBe(PRT5.STX);
    expect(cmd.subarray(1, 7).toString("ascii")).toBe("001658");
    expect(cmd[7]).toBe(PRT5.ETX);
  });

  it("monta tara 360g como no manual", () => {
    const cmd = buildSetTareGramsCommand(360);
    expect(cmd[0]).toBe(PRT5.SOH);
    expect(cmd.subarray(1, 7).toString("ascii")).toBe("000360");
    expect(cmd[7]).toBe(PRT5.ETX);
  });

  it("parseia peso estável 14,385 kg", () => {
    const frame = parseWeightField("14385");
    expect(frame.status).toBe("stable");
    expect(frame.kg).toBe(14.385);
  });

  it("parseia IIIII / NNNNN / SSSSS", () => {
    expect(parseWeightField("IIIII").status).toBe("unstable");
    expect(parseWeightField("NNNNN").status).toBe("negative");
    expect(parseWeightField("SSSSS").status).toBe("overload");
  });

  it("parseia resposta completa STX…ETX", () => {
    const buf = Buffer.from([0x02, ...Buffer.from("14385"), 0x03]);
    expect(parseWeightResponse(buf).kg).toBe(14.385);
  });
});
