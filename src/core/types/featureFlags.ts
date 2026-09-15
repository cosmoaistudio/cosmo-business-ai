export const FeatureModules = {
  orders: "orders",
  delivery: "delivery",
  crm: "crm",
  finance: "finance",
  pdv: "pdv",
  ai: "ai",
  loyalty: "loyalty",
  marketplace: "marketplace",
  automations: "automations",
  inventory: "inventory",
  products: "products",
} as const;

export type FeatureModule = (typeof FeatureModules)[keyof typeof FeatureModules];

export const FEATURE_MODULE_LABELS: Record<FeatureModule, string> = {
  orders: "Pedidos",
  delivery: "Delivery",
  crm: "CRM / Clientes",
  finance: "Financeiro",
  pdv: "PDV",
  ai: "Cosmo AI",
  loyalty: "Fidelidade",
  marketplace: "Marketplace",
  automations: "Automações",
  inventory: "Estoque",
  products: "Produtos",
};

/** Módulos habilitados por padrão quando não há registro no banco */
export const DEFAULT_ENABLED_MODULES: FeatureModule[] = [
  "products",
  "inventory",
  "pdv",
  "finance",
  "crm",
  "automations",
  "ai",
  "orders",
];

export interface OrganizationFeatureFlag {
  id: string;
  organization_id: string;
  module_key: FeatureModule;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
