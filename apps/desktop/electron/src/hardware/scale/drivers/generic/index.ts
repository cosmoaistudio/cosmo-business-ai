import { createUnimplementedScaleDriver } from "../baseUnimplemented.js";

/**
 * Generic serial/ASCII scale slot.
 * Intentionally does not open COM ports without a verified frame parser.
 * Future: optional `serialport` + documented ASCII line format.
 */
export const genericScaleDriver = createUnimplementedScaleDriver({
  manufacturer: "generic",
  label: "Genérica (serial ASCII)",
  models: ["ASCII contínuo / sob demanda"],
  protocolImplemented: false,
  notes:
    "Arquitetura para serialport + parser ASCII documentado. Sem módulo nativo serial nesta RC1 para não quebrar o build Electron.",
});
