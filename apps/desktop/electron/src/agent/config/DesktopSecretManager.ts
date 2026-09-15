import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

export const DESKTOP_ENV_FILENAME = ".env.desktop";

export const DESKTOP_ENV_VARIABLES = [
  {
    key: "COSMO_SUPABASE_URL",
    required: true,
    description: "URL do projeto Supabase",
  },
  {
    key: "COSMO_SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    description: "Service Role Key (somente Electron Main)",
  },
  {
    key: "COSMO_ORGANIZATION_ID",
    required: true,
    description: "UUID da organização deste terminal",
  },
  {
    key: "COSMO_AGENT_NAME",
    required: true,
    description: "Nome exibido deste desktop (ex: PDV Loja 1)",
  },
  {
    key: "COSMO_AGENT_ID",
    required: false,
    description: "UUID do agente (opcional — auto-registro na 1ª execução)",
  },
] as const;

export interface DesktopSecrets {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  organizationId: string;
  agentId: string | null;
  agentName: string;
}

export type DesktopConfigReason = "missing_file" | "incomplete" | "read_error";

export interface DesktopConfigStatus {
  configured: boolean;
  reason?: DesktopConfigReason;
  missingVariables: string[];
  message: string;
  secrets?: DesktopSecrets;
}

export class DesktopSecretValidationError extends Error {
  readonly missingVariables: string[];
  readonly reason: DesktopConfigReason;

  constructor(
    message: string,
    missingVariables: string[] = [],
    reason: DesktopConfigReason = "incomplete"
  ) {
    super(message);
    this.name = "DesktopSecretValidationError";
    this.missingVariables = missingVariables;
    this.reason = reason;
  }
}

function getEnvPath() {
  return path.join(process.cwd(), DESKTOP_ENV_FILENAME);
}

function parseSecretsFromEnv(): {
  secrets: DesktopSecrets | null;
  missing: string[];
} {
  const supabaseUrl = process.env.COSMO_SUPABASE_URL?.trim() ?? "";
  const supabaseServiceRoleKey =
    process.env.COSMO_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const organizationId = process.env.COSMO_ORGANIZATION_ID?.trim() ?? "";
  const agentName = process.env.COSMO_AGENT_NAME?.trim() ?? "";
  const agentIdRaw = process.env.COSMO_AGENT_ID?.trim() ?? "";

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("COSMO_SUPABASE_URL");
  if (!supabaseServiceRoleKey) missing.push("COSMO_SUPABASE_SERVICE_ROLE_KEY");
  if (!organizationId) missing.push("COSMO_ORGANIZATION_ID");
  if (!agentName) missing.push("COSMO_AGENT_NAME");

  if (missing.length > 0) {
    return { secrets: null, missing };
  }

  return {
    secrets: {
      supabaseUrl,
      supabaseServiceRoleKey,
      organizationId,
      agentId: agentIdRaw || null,
      agentName,
    },
    missing: [],
  };
}

export class DesktopSecretManager {
  private static secrets: DesktopSecrets | null = null;
  private static status: DesktopConfigStatus | null = null;

  static isConfigured() {
    return this.probe().configured;
  }

  static isLoaded() {
    return this.secrets !== null;
  }

  static probe(): DesktopConfigStatus {
    if (this.status) {
      return this.status;
    }

    const envPath = getEnvPath();

    if (!existsSync(envPath)) {
      this.status = {
        configured: false,
        reason: "missing_file",
        missingVariables: [DESKTOP_ENV_FILENAME],
        message:
          "O Desktop Agent ainda não foi configurado neste terminal. " +
          "O Cosmo continuará em modo local.",
      };
      return this.status;
    }

    const { error } = config({ path: envPath });

    if (error) {
      this.status = {
        configured: false,
        reason: "read_error",
        missingVariables: [],
        message:
          "Não foi possível ler a configuração do Desktop Agent. " +
          "O Cosmo continuará em modo local.",
      };
      return this.status;
    }

    const { secrets, missing } = parseSecretsFromEnv();

    if (!secrets) {
      this.status = {
        configured: false,
        reason: "incomplete",
        missingVariables: missing,
        message:
          "A configuração do Desktop Agent está incompleta. " +
          "O Cosmo continuará em modo local.",
      };
      return this.status;
    }

    this.secrets = secrets;
    this.status = {
      configured: true,
      missingVariables: [],
      message: "Desktop Agent configurado.",
      secrets,
    };

    return this.status;
  }

  static load(): DesktopSecrets {
    const status = this.probe();

    if (!status.configured || !status.secrets) {
      throw new DesktopSecretValidationError(
        status.message,
        status.missingVariables,
        status.reason ?? "incomplete"
      );
    }

    return status.secrets;
  }

  static reset() {
    this.secrets = null;
    this.status = null;
  }
}

export function buildDesktopAgentNoticeDetail(status: DesktopConfigStatus) {
  const requiredVars = DESKTOP_ENV_VARIABLES.filter((v) => v.required)
    .map((v) => `• ${v.key} — ${v.description}`)
    .join("\n");

  const optionalVars = DESKTOP_ENV_VARIABLES.filter((v) => !v.required)
    .map((v) => `• ${v.key} — ${v.description}`)
    .join("\n");

  const missingBlock =
    status.missingVariables.length > 0
      ? `\n\nPendências:\n${status.missingVariables.map((v) => `• ${v}`).join("\n")}`
      : "";

  return (
    `${status.message}\n\n` +
    "Você pode usar o Cosmo normalmente — PDV, impressora e interface web funcionam sem o agente remoto.\n\n" +
    "Para habilitar controle remoto e sincronização avançada:\n" +
    "1. Copie .env.desktop.example para .env.desktop na raiz do projeto\n" +
    "2. Preencha as variáveis abaixo\n" +
    "3. Reinicie o Cosmo Desktop\n\n" +
    "Variáveis obrigatórias:\n" +
    requiredVars +
    "\n\nOpcional:\n" +
    optionalVars +
    missingBlock +
    "\n\nDocumentação: docs/DESKTOP_AGENT_SETUP.md"
  );
}
