import { createUnimplementedScaleDriver } from "../baseUnimplemented.js";

export const filizolaScaleDriver = createUnimplementedScaleDriver({
  manufacturer: "filizola",
  label: "Filizola",
  models: ["Filizola (linha comercial)"],
  protocolImplemented: false,
  notes:
    "Requer protocolo Filizola. Arquitetura pronta; implementação aguarda docs oficiais.",
});
