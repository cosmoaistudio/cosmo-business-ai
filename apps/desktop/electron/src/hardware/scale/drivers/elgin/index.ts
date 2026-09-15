import { createUnimplementedScaleDriver } from "../baseUnimplemented.js";

export const elginScaleDriver = createUnimplementedScaleDriver({
  manufacturer: "elgin",
  label: "Elgin",
  models: ["Elgin (linha comercial)"],
  protocolImplemented: false,
  notes:
    "Requer protocolo/SDK Elgin para balanças. Não confundir com impressoras Elgin ESC/POS.",
});
