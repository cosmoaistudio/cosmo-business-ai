import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/auth";

const PROFILE_SELECT = "*, organizations(id, name)";

export async function fetchProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
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

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function subscribeToAuthChanges(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback);
}
