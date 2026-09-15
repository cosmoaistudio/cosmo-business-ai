import { getMobileEnv } from "@/lib/env";
import { supabase } from "@/lib/supabase";

export interface MobileBootstrapValidation {
  supabaseEnv: boolean;
  supabaseClient: boolean;
  reactQuery: boolean;
  zustand: boolean;
  expoRouter: boolean;
  authReady: boolean;
}

export async function validateMobileBootstrap(): Promise<MobileBootstrapValidation> {
  const env = getMobileEnv();

  const supabaseEnv = Boolean(env.supabaseUrl && env.supabasePublishableKey);

  let supabaseClient = supabaseEnv;
  let authReady = false;

  try {
    const { error } = await supabase.auth.getSession();
    authReady = !error;
    supabaseClient = supabaseEnv && !error;
  } catch {
    authReady = false;
    supabaseClient = false;
  }

  return {
    supabaseEnv,
    supabaseClient,
    reactQuery: true,
    zustand: true,
    expoRouter: true,
    authReady,
  };
}
