import { create } from "zustand";
import type { UserProfile } from "@/types/auth";

interface AuthStore {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  profile: UserProfile | null;
  organizationId: string | null;
  profileError: string | null;
  setLoading: (isLoading: boolean) => void;
  setSession: (payload: {
    userId: string | null;
    email: string | null;
    profile: UserProfile | null;
    profileError?: string | null;
  }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  userId: null,
  email: null,
  profile: null,
  organizationId: null,
  profileError: null,
  setLoading: (isLoading) => set({ isLoading }),
  setSession: ({ userId, email, profile, profileError = null }) =>
    set({
      userId,
      email,
      profile,
      organizationId: profile?.organization_id ?? null,
      profileError,
      isAuthenticated: Boolean(userId),
      isLoading: false,
    }),
  clear: () =>
    set({
      isLoading: false,
      isAuthenticated: false,
      userId: null,
      email: null,
      profile: null,
      organizationId: null,
      profileError: null,
    }),
}));
