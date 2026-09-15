export type PrinterBrand =
  | "epson"
  | "bematech"
  | "elgin"
  | "daruma"
  | "windows"
  | "generic";

export type PrinterRole = "cash" | "kitchen" | "delivery";

export type PrinterTransport = "network" | "windows_spooler";

export interface DetectedPrinter {
  name: string;
  driver: string;
  status: string;
  isDefault: boolean;
  type: "windows" | "network" | "unknown";
  portName?: string;
}

export interface PrinterRoleConfig {
  role: PrinterRole;
  brand: PrinterBrand;
  transport: PrinterTransport;
  windowsPrinterName?: string;
  host?: string;
  port?: number;
}

export interface PrintManagerConfig {
  roles: PrinterRoleConfig[];
  lastTicketLines: string[] | null;
  autoPrintDigitalOrders: boolean;
  autoPrintPdv: boolean;
}

export type ScaleManufacturer =
  | "toledo"
  | "filizola"
  | "urano"
  | "elgin"
  | "prix"
  | "generic";

export type ScaleConnectionType =
  | "usb"
  | "usb_serial"
  | "serial_rs232"
  | "com"
  | "ethernet"
  | "bluetooth";

export interface ScalePortInfo {
  path: string;
  label: string;
  kind: ScaleConnectionType | "unknown";
}

export interface ScaleConnectionConfig {
  manufacturer: ScaleManufacturer;
  model: string;
  connectionType: ScaleConnectionType;
  port: string;
  baudRate: number;
  dataBits: 7 | 8;
  parity: "none" | "even" | "odd";
  stopBits: 1 | 2;
  handshake: "none" | "xons" | "rts";
}

export interface ScaleWeightReading {
  kg: number;
  stable: boolean;
  raw?: string;
  source: ScaleManufacturer;
}

export interface ScaleDriverCapability {
  manufacturer: ScaleManufacturer;
  label: string;
  models: string[];
  /** true only when a real protocol implementation exists */
  protocolImplemented: boolean;
  notes: string;
}

export interface FirstRunCompany {
  name: string;
  phone: string;
  address: string;
  cnpj: string;
  logoDataUrl?: string;
}

export type BusinessType =
  | "acai"
  | "restaurante"
  | "pizzaria"
  | "hamburgueria"
  | "padaria"
  | "sorveteria"
  | "cafeteria"
  | "outro";

export interface FirstRunState {
  completed: boolean;
  completedAt: string | null;
  company: FirstRunCompany | null;
  businessType: BusinessType | null;
}

export interface HardwareDiagnosticsSnapshot {
  checkedAt: string;
  version: string;
  electron: string;
  desktopAgent: { status: string; detail: string };
  internet: { ok: boolean; detail: string };
  supabase: { ok: boolean; detail: string };
  printers: DetectedPrinter[];
  scales: ScaleDriverCapability[];
  comPorts: ScalePortInfo[];
  usbHint: string;
}
