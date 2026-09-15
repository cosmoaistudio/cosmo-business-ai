import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import {
  DesktopSecretManager,
  type DesktopSecrets,
} from "./DesktopSecretManager.js";

export type DesktopEnvironment = "development" | "production";

interface PersistedDesktopConfig {
  organizationId: string;
  agentId?: string;
  desktopName: string;
  machineId: string;
  environment: DesktopEnvironment;
}

const FALLBACK_NAME = "Cosmo Desktop";

export class DesktopConfig {
  private config: PersistedDesktopConfig | null = null;
  private configPath = "";
  private secrets: DesktopSecrets | null = null;

  async load() {
    const probe = DesktopSecretManager.probe();
    this.secrets = probe.configured ? probe.secrets ?? null : null;

    this.configPath = path.join(app.getPath("userData"), "desktop-config.json");
    await mkdir(path.dirname(this.configPath), { recursive: true });

    const environment: DesktopEnvironment =
      process.env.NODE_ENV === "production" && app.isPackaged
        ? "production"
        : "development";

    const orgId = this.secrets?.organizationId ?? "";
    const agentName = this.secrets?.agentName ?? FALLBACK_NAME;
    const agentId = this.secrets?.agentId ?? undefined;

    try {
      const raw = await readFile(this.configPath, "utf8");
      this.config = JSON.parse(raw) as PersistedDesktopConfig;
      this.config.organizationId = orgId || this.config.organizationId;
      this.config.desktopName = agentName || this.config.desktopName;
      this.config.environment = environment;

      if (agentId) {
        this.config.agentId = agentId;
      }
    } catch {
      this.config = {
        organizationId: orgId,
        agentId,
        desktopName: agentName,
        machineId: randomUUID(),
        environment,
      };

      await this.persist();
    }
  }

  hasRemoteAgentConfig() {
    return DesktopSecretManager.isConfigured();
  }

  getOrganizationId() {
    return this.config?.organizationId ?? this.secrets?.organizationId ?? "";
  }

  getAgentId() {
    return this.secrets?.agentId ?? this.config?.agentId ?? null;
  }

  setAgentId(agentId: string) {
    if (!this.config) return;
    this.config.agentId = agentId;
  }

  getDesktopName() {
    return this.config?.desktopName ?? this.secrets?.agentName ?? FALLBACK_NAME;
  }

  getMachineId() {
    return this.config?.machineId ?? "";
  }

  getEnvironment(): DesktopEnvironment {
    return this.config?.environment ?? "development";
  }

  async persist() {
    if (!this.config) return;
    await writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf8");
  }
}

export const desktopConfig = new DesktopConfig();
