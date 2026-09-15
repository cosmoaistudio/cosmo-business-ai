import { promises as fs } from "node:fs";
import type { PrintJobPayload } from "../ipc/channels.js";
import { printerService } from "../printer/printerService.js";
import { getHardwareConfigPath } from "../config/storePaths.js";
import { listWindowsPrinters } from "./windowsDevices.js";
import { buildTicket80mmLines, type Ticket80mmInput } from "./ticketLayout.js";
import type {
  DetectedPrinter,
  PrintManagerConfig,
  PrinterBrand,
  PrinterRole,
  PrinterRoleConfig,
} from "./types.js";

const DEFAULT_CONFIG: PrintManagerConfig = {
  roles: [
    {
      role: "cash",
      brand: "generic",
      transport: "windows_spooler",
    },
    {
      role: "kitchen",
      brand: "generic",
      transport: "windows_spooler",
    },
    {
      role: "delivery",
      brand: "generic",
      transport: "windows_spooler",
    },
  ],
  lastTicketLines: null,
  autoPrintDigitalOrders: true,
  autoPrintPdv: true,
};

export class PrintManager {
  private config: PrintManagerConfig = structuredClone(DEFAULT_CONFIG);
  private configPath = "";

  async initialize(userDataPath: string) {
    this.configPath = getHardwareConfigPath();
    // userDataPath reserved for future multi-file layouts
    void userDataPath;
    await this.load();
  }

  getConfig() {
    return this.config;
  }

  async saveConfig(partial: Partial<PrintManagerConfig>) {
    this.config = {
      ...this.config,
      ...partial,
      roles: partial.roles ?? this.config.roles,
    };
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf8");
    return this.config;
  }

  async setRole(roleConfig: PrinterRoleConfig) {
    const roles = this.config.roles.filter((item) => item.role !== roleConfig.role);
    roles.push(roleConfig);
    return this.saveConfig({ roles });
  }

  async detectPrinters(): Promise<DetectedPrinter[]> {
    return listWindowsPrinters();
  }

  getSupportedBrands(): { id: PrinterBrand; label: string; notes: string }[] {
    return [
      { id: "epson", label: "Epson", notes: "ESC/POS padrão (TCP 9100 / spooler)" },
      { id: "bematech", label: "Bematech", notes: "Preset ESC/POS (code page)" },
      { id: "elgin", label: "Elgin", notes: "Preset ESC/POS" },
      {
        id: "daruma",
        label: "Daruma",
        notes:
          "Arquitetura ESC/POS genérica. SDK proprietário Daruma não embutido — validar no equipamento.",
      },
      {
        id: "windows",
        label: "Impressoras Windows",
        notes: "Spooler do SO via driver instalado",
      },
      { id: "generic", label: "Genérica ESC/POS", notes: "Fallback universal" },
    ];
  }

  async printTest(role: PrinterRole = "cash") {
    const roleConfig = this.config.roles.find((item) => item.role === role);
    const lines = [
      "TESTE COSMO BUSINESS RC1",
      `Papel: 80mm`,
      `Papelaria: ${role}`,
      `Marca: ${roleConfig?.brand ?? "generic"}`,
      new Date().toLocaleString("pt-BR"),
      "Se este ticket saiu, a impressão está OK.",
    ];

    return this.enqueueForRole(role, {
      type: "receipt",
      title: "TESTE DE IMPRESSAO",
      lines,
    });
  }

  async reprintLastTicket() {
    if (!this.config.lastTicketLines?.length) {
      return { ok: false as const, error: "Nenhum ticket anterior para reimprimir" };
    }

    return this.enqueueForRole("cash", {
      type: "receipt",
      title: "REIMPRESSAO",
      lines: this.config.lastTicketLines,
    });
  }

  async printTicket80mm(input: Ticket80mmInput, role: PrinterRole = "cash") {
    const lines = buildTicket80mmLines(input);
    this.config.lastTicketLines = lines;
    await this.saveConfig({ lastTicketLines: lines });
    return this.enqueueForRole(role, {
      type: input.kind === "order" ? "order" : "receipt",
      title: input.title,
      lines,
      openDrawer: input.openDrawer,
    });
  }

  private async enqueueForRole(role: PrinterRole, job: PrintJobPayload) {
    const roleConfig = this.config.roles.find((item) => item.role === role);
    const brand = roleConfig?.brand ?? "generic";
    const driver = brand === "windows" ? "generic" : brand;

    const payload: PrintJobPayload = {
      ...job,
      driver: driver as PrintJobPayload["driver"],
      host:
        roleConfig?.transport === "network" ? roleConfig.host || undefined : undefined,
      port: roleConfig?.port,
    };

    // Named Windows printer is selected by OS default when host is empty;
    // future: route by windowsPrinterName via spooler target.
    if (job.type === "order") {
      return printerService.printOrder(payload);
    }
    return printerService.printReceipt(payload);
  }

  private async load() {
    try {
      const raw = await fs.readFile(this.configPath, "utf8");
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      this.config = structuredClone(DEFAULT_CONFIG);
    }
  }
}

export const printManager = new PrintManager();
