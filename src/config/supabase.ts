import { createClient } from "@supabase/supabase-js";
import {
  getAuthRedirectUrl as resolveAuthRedirectUrl,
  isElectronAuthEnvironment,
} from "@/features/auth/oauth/oauthRedirect";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias."
  );
}

const electronAuth = isElectronAuthEnvironment();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    /** PKCE required for Electron external-browser + deep-link return. */
    flowType: "pkce",
    /** Web handles ?code= on HTTP(S); Electron uses deep-link + exchangeCodeForSession. */
    detectSessionInUrl: !electronAuth,
  },
});

export function getAuthRedirectUrl(path = "/") {
  return resolveAuthRedirectUrl(path);
}
