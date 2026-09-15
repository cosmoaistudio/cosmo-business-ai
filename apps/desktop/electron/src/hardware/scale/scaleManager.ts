import { promises as fs } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { listComPorts } from "../windowsDevices.js";
import type { ScaleConnectionConfig, ScaleWeightReading } from "../types.js";
import { listScaleCapabilities, resolveScaleDriver } from "./drivers/index.js";
import type { ScaleDriver } from "./ScaleDriver.js";

const DEFAULT_CONFIG: ScaleConnectionConfig = {
  manufacturer: "generic",
  model: "ASCII",
  connectionType: "com",
  port: "COM1",
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  handshake: "none",
};

export class ScaleManager {
  private config: ScaleConnectionConfig = { ...DEFAULT_CONFIG };
  private driver: ScaleDriver = resolveScaleDriver("generic");
  private configPath = "";

  async initialize() {
    this.configPath = path.join(app.getPath("userData"), "scale-config.json");
    await this.load();
    this.driver = resolveScaleDriver(this.config.manufacturer);
  }

  getConfig() {
    return this.config;
  }

  getCapabilities() {
    return listScaleCapabilities();
  }

  async listPorts() {
    return listComPorts();
  }

  async saveConfig(config: ScaleConnectionConfig) {
    if (this.driver.isConnected()) {
      await this.driver.disconnect();
    }
    this.config = config;
    this.driver = resolveScaleDriver(config.manufacturer);
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), "utf8");
    return this.config;
  }

  async connect() {
    await this.driver.connect(this.config);
    return {
      ok: true,
      detail: `Driver ${this.driver.capability.label} preparado na porta ${this.config.port}. Protocolo implementado: ${this.driver.capability.protocolImplemented}`,
    };
  }

  async disconnect() {
    await this.driver.disconnect();
    return { ok: true };
  }

  isConnected() {
    return this.driver.isConnected();
  }

  async readWeight(): Promise<ScaleWeightReading> {
    return this.driver.readWeight();
  }

  async zero() {
    await this.driver.zero();
    return { ok: true };
  }

  async tare() {
    await this.driver.tare();
    return { ok: true };
  }

  async testCommunication() {
    return this.driver.testCommunication();
  }

  private async load() {
    try {
      const raw = await fs.readFile(this.configPath, "utf8");
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      this.config = { ...DEFAULT_CONFIG };
    }
  }
}

export const scaleManager = new ScaleManager();
