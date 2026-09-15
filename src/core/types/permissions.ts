/**
 * Papéis suportados pela plataforma Cosmo.
 * Roles ativas (admin, manager, cashier, kitchen) alinhadas ao banco (009 + 029).
 * Roles futuros (delivery, finance) permanecem na infraestrutura.
 */
export const CosmoRoles = {
  admin: "admin",
  manager: "manager",
  cashier: "cashier",
  kitchen: "kitchen",
  delivery: "delivery",
  finance: "finance",
} as const;

export type CosmoRole = (typeof CosmoRoles)[keyof typeof CosmoRoles];

/** Roles atualmente persistidas no banco (migrations 009 + 029) */
export type ActiveCosmoRole = "admin" | "manager" | "cashier" | "kitchen";

export const ROLE_LABELS: Record<CosmoRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Caixa",
  kitchen: "Cozinha",
  delivery: "Entregador",
  finance: "Financeiro",
};

export type Permission =
  | "dashboard:read"
  | "products:read"
  | "products:write"
  | "inventory:read"
  | "inventory:write"
  | "pdv:access"
  | "finance:read"
  | "finance:write"
  | "customers:read"
  | "customers:write"
  | "orders:read"
  | "orders:write"
  | "automations:read"
  | "automations:write"
  | "settings:read"
  | "settings:write"
  | "ai:read";

export const ROLE_PERMISSIONS: Record<CosmoRole, Permission[]> = {
  admin: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "pdv:access",
    "finance:read",
    "finance:write",
    "customers:read",
    "customers:write",
    "orders:read",
    "orders:write",
    "automations:read",
    "automations:write",
    "settings:read",
    "settings:write",
    "ai:read",
  ],
  manager: [
    "dashboard:read",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "pdv:access",
    "finance:read",
    "finance:write",
    "customers:read",
    "customers:write",
    "orders:read",
    "orders:write",
    "automations:read",
    "automations:write",
    "ai:read",
  ],
  cashier: [
    "pdv:access",
    "customers:read",
    "customers:write",
  ],
  kitchen: ["orders:read", "orders:write"],
  delivery: ["orders:read", "orders:write"],
  finance: ["finance:read", "finance:write", "dashboard:read"],
};

export type AppRoute =
  | "/"
  | "/produtos"
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
  | "/configuracoes";

export const ROUTE_PERMISSIONS: Record<AppRoute, ActiveCosmoRole[]> = {
  "/": ["admin", "manager"],
  "/produtos": ["admin", "manager"],
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
  "/configuracoes": ["admin"],
};

export const DEFAULT_ROUTE_BY_ROLE: Record<ActiveCosmoRole, AppRoute> = {
  admin: "/",
  manager: "/",
  cashier: "/pdv",
  kitchen: "/cozinha",
};
