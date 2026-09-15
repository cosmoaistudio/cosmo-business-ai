export type UserRole = "admin" | "manager" | "cashier" | "kitchen";

export const USER_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "cashier",
  "kitchen",
] as const;

export interface Organization {
  id: string;
  name: string;
  business_type?: string | null;
  segment?: string | null;
  city?: string | null;
  whatsapp?: string | null;
  logo_url?: string | null;
  /** false = wizard obrigatório; null/undefined = migration ainda não aplicada (tratado como completo) */
  onboarding_completed?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * RBAC preparado (conceitual). No banco atual o vínculo usuário↔empresa
 * é `profiles` com role operacional (admin|manager|cashier|kitchen).
 * `owner` mapeia para admin que configurou a empresa no onboarding.
 */
export type MembershipRole = "owner" | "admin" | "manager" | "employee";

export interface CompanyMembership {
  userId: string;
  organizationId: string;
  /** Role operacional persistido em profiles.role */
  role: UserRole;
  /** Visão de membership para futura gestão de funcionários */
  membershipRole: MembershipRole;
}

export function toMembershipRole(role: UserRole): MembershipRole {
  if (role === "admin") return "owner";
  if (role === "manager") return "manager";
  return "employee";
}

export interface UserProfile {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  full_name?: string | null;
  created_at?: string;
  updated_at?: string;
  organizations?: Organization | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Caixa",
  kitchen: "Cozinha",
};

export type AppRoute =
  | "/"
  | "/operacoes"
  | "/produtos"
  | "/produtos/builder"
  | "/estoque"
  | "/pdv"
  | "/financeiro"
  | "/pedidos"
  | "/cozinha"
  | "/clientes"
  | "/opcoes/grupos"
  | "/opcoes/itens"
  | "/automacoes"
  | "/ia"
  | "/cerebro"
  | "/crescimento"
  | "/configuracoes"
  | "/configuracoes/pedido-digital"
  | "/configuracoes/hardware"
  | "/meu-plano"
  | "/ajuda"
  | "/diagnostico"
  | "/onboarding"
  | "/assistente"
  | "/design-preview";

export const ROUTE_PERMISSIONS: Record<AppRoute, UserRole[]> = {
  "/": ["admin", "manager"],
  "/operacoes": ["admin", "manager"],
  "/produtos": ["admin", "manager"],
  "/produtos/builder": ["admin", "manager"],
  "/estoque": ["admin", "manager"],
  "/pdv": ["admin", "manager", "cashier"],
  "/financeiro": ["admin", "manager"],
  "/pedidos": ["admin", "manager"],
  "/cozinha": ["admin", "manager", "cashier", "kitchen"],
  "/clientes": ["admin", "manager", "cashier"],
  "/opcoes/grupos": ["admin", "manager"],
  "/opcoes/itens": ["admin", "manager"],
  "/automacoes": ["admin", "manager"],
  "/ia": ["admin", "manager"],
  "/cerebro": ["admin", "manager"],
  "/crescimento": ["admin", "manager"],
  "/configuracoes": ["admin"],
  "/configuracoes/pedido-digital": ["admin"],
  "/configuracoes/hardware": ["admin", "manager"],
  "/meu-plano": ["admin"],
  "/ajuda": ["admin", "manager", "cashier", "kitchen"],
  "/diagnostico": ["admin", "manager"],
  "/onboarding": ["admin", "manager", "cashier", "kitchen"],
  "/assistente": ["admin", "manager"],
  "/design-preview": ["admin"],
};

export const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, AppRoute> = {
  admin: "/",
  manager: "/",
  cashier: "/pdv",
  kitchen: "/cozinha",
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function canAccessRoute(role: UserRole | null | undefined, path: AppRoute) {
  if (!role) return false;
  return ROUTE_PERMISSIONS[path]?.includes(role) ?? false;
}

export function getDefaultRouteForRole(role: UserRole | null | undefined): string {
  if (!role) return "/login";
  return DEFAULT_ROUTE_BY_ROLE[role];
}

/** Profile must always belong to a tenant organization. */
export function hasOrganizationId(
  profile: Pick<UserProfile, "organization_id"> | null | undefined
): boolean {
  return Boolean(profile?.organization_id?.trim());
}
