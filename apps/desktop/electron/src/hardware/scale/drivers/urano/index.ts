import { createUnimplementedScaleDriver } from "../baseUnimplemented.js";

export const uranoScaleDriver = createUnimplementedScaleDriver({
  manufacturer: "urano",
  label: "Urano",
  models: ["Urano (linha comercial)"],
  protocolImplemented: false,
  notes:
    "Requer protocolo Urano. Placeholder estrutural — sem simulação de peso.",
});
