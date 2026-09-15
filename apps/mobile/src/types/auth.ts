export type UserRole = "admin" | "manager" | "cashier" | "kitchen";

export interface Organization {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  full_name?: string | null;
  organizations?: Organization | null;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  profile: UserProfile | null;
}
