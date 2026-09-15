import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DesktopSecretManager,
  DesktopSecretValidationError,
} from "../config/DesktopSecretManager.js";

let client: SupabaseClient | null = null;

export function getDesktopSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  if (!DesktopSecretManager.isConfigured()) {
    throw new DesktopSecretValidationError(
      "Desktop Agent não configurado.",
      [],
      "missing_file"
    );
  }

  const secrets = DesktopSecretManager.load();

  client = createClient(secrets.supabaseUrl, secrets.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

export function resetDesktopSupabaseClient() {
  client = null;
}
