import { createUnimplementedScaleDriver } from "../baseUnimplemented.js";

export const prixScaleDriver = createUnimplementedScaleDriver({
  manufacturer: "prix",
  label: "Prix",
  models: ["Prix 3 Fit", "Prix 3 Fit/2"],
  protocolImplemented: false,
  notes:
    "Linha Prix (Toledo). Protocolo proprietário — aguarda documentação para driver real.",
});
