import type { PrinterDriver } from "../escpos.js";
import { buildEscPosBuffer, type EscPosDocument } from "../escpos.js";

export interface PrinterDriverAdapter {
  id: PrinterDriver;
  name: string;
  build(document: EscPosDocument): Buffer;
}

function createAdapter(id: PrinterDriver, name: string): PrinterDriverAdapter {
  return {
    id,
    name,
    build(document) {
      return buildEscPosBuffer(document, id);
    },
  };
}

export const epsonDriver = createAdapter("epson", "Epson ESC/POS");
export const bematechDriver = createAdapter("bematech", "Bematech ESC/POS");
export const elginDriver = createAdapter("elgin", "Elgin ESC/POS");
export const darumaDriver = createAdapter("daruma", "Daruma ESC/POS (preset)");
export const genericDriver = createAdapter("generic", "Generic ESC/POS");

export const PRINTER_DRIVERS: Record<PrinterDriver, PrinterDriverAdapter> = {
  epson: epsonDriver,
  bematech: bematechDriver,
  elgin: elginDriver,
  daruma: darumaDriver,
  generic: genericDriver,
};

export function resolveDriver(driver?: string): PrinterDriverAdapter {
  if (driver && driver in PRINTER_DRIVERS) {
    return PRINTER_DRIVERS[driver as PrinterDriver];
  }

  return genericDriver;
}
