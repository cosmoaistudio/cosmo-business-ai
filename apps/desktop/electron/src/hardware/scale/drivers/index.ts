import type { ScaleManufacturer } from "../../types.js";
import type { ScaleDriver } from "../ScaleDriver.js";
import { elginScaleDriver } from "./elgin/index.js";
import { filizolaScaleDriver } from "./filizola/index.js";
import { genericScaleDriver } from "./generic/index.js";
import { prixScaleDriver } from "./prix/index.js";
import { toledoScaleDriver } from "./toledo/index.js";
import { uranoScaleDriver } from "./urano/index.js";

const DRIVERS: Record<ScaleManufacturer, ScaleDriver> = {
  toledo: toledoScaleDriver,
  filizola: filizolaScaleDriver,
  urano: uranoScaleDriver,
  elgin: elginScaleDriver,
  prix: prixScaleDriver,
  generic: genericScaleDriver,
};

export function resolveScaleDriver(manufacturer: ScaleManufacturer): ScaleDriver {
  return DRIVERS[manufacturer] ?? genericScaleDriver;
}

export function listScaleCapabilities() {
  return Object.values(DRIVERS).map((driver) => driver.capability);
}
