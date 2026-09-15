const FORBIDDEN_MOBILE_ENV_KEYS = [
  "COSMO_SUPABASE_SERVICE_ROLE_KEY",
  "COSMO_AGENT_ID",
  "COSMO_ORGANIZATION_ID",
  "COSMO_AGENT_NAME",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export interface MobileEnvConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

let cachedEnv: MobileEnvConfig | null = null;

function readEnv(key: string) {
  return process.env[key]?.trim() ?? "";
}

function assertNoDesktopSecrets() {
  for (const key of FORBIDDEN_MOBILE_ENV_KEYS) {
    const direct = readEnv(key);
    const expoPublic = readEnv(`EXPO_PUBLIC_${key}`);

    if (direct || expoPublic) {
      throw new Error(
        `[Cosmo Mobile] Variável proibida no app mobile: ${key}. ` +
          "Credenciais de Desktop Agent não podem ser usadas no Mobile."
      );
    }
  }

  const serviceRole =
    readEnv("EXPO_PUBLIC_COSMO_SUPABASE_SERVICE_ROLE_KEY") ||
    readEnv("EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");

  if (serviceRole) {
    throw new Error(
      "[Cosmo Mobile] SERVICE_ROLE_KEY é proibida no app mobile."
    );
  }
}

export function getMobileEnv(): MobileEnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  assertNoDesktopSecrets();

  const supabaseUrl = readEnv("EXPO_PUBLIC_SUPABASE_URL");
  const supabasePublishableKey = readEnv("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  const missing: string[] = [];

  if (!supabaseUrl) missing.push("EXPO_PUBLIC_SUPABASE_URL");
  if (!supabasePublishableKey) missing.push("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `[Cosmo Mobile] Variáveis ausentes: ${missing.join(", ")}. ` +
        "Copie apps/mobile/.env.example para apps/mobile/.env."
    );
  }

  cachedEnv = {
    supabaseUrl,
    supabasePublishableKey,
  };

  return cachedEnv;
}
