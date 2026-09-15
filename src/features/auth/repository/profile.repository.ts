import { supabase } from "@/config/supabase";
import type { UserProfile } from "../types/roles";

const PROFILE_SELECT_FULL =
  "*, organizations(id, name, business_type, segment, city, whatsapp, logo_url, onboarding_completed, created_at, updated_at)";

const PROFILE_SELECT_LEGACY = "*, organizations(id, name)";

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  const message =
    "message" in error ? String((error as { message?: string }).message) : "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /onboarding_completed|business_type|column/i.test(message)
  );
}

async function fetchProfileByUserId(userId: string) {
  const full = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_FULL)
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error) {
    return full.data as UserProfile | null;
  }

  if (!isMissingColumnError(full.error)) {
    throw full.error;
  }

  const legacy = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_LEGACY)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacy.error) throw legacy.error;
  return legacy.data as UserProfile | null;
}

export async function getMyProfile(userId?: string, maxAttempts = 6) {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    resolvedUserId = user.id;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const profile = await fetchProfileByUserId(resolvedUserId);
    if (profile) return profile;

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return null;
}
