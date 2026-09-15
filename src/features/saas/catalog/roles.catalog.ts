import type { SaasRoleCatalogItem } from "../types/saasRoles";

export const SAAS_ROLE_CATALOG: SaasRoleCatalogItem[] = [
  {
    id: "admin",
    label: "Administrador",
    description: "Acesso total à conta, assinatura e configurações.",
    availability: "active",
    authRole: "admin",
    suggestedPermissions: ["settings:write", "finance:write", "automations:write"],
  },
  {
    id: "manager",
    label: "Gerente",
    description: "Opera catálogo, pedidos, estoque e inteligência.",
    availability: "active",
    authRole: "manager",
    suggestedPermissions: ["products:write", "orders:write", "ai:read"],
  },
  {
    id: "cashier",
    label: "Caixa",
    description: "PDV, clientes e cozinha operacional.",
    availability: "active",
    authRole: "cashier",
    suggestedPermissions: ["pdv:access", "customers:write"],
  },
  {
    id: "kitchen",
    label: "Cozinha",
    description: "Somente KDS: preparo, pronto e impressão da cozinha.",
    availability: "active",
    authRole: "kitchen",
    suggestedPermissions: ["orders:read", "orders:write"],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Growth Hub, campanhas e conteúdo — papél planejado.",
    availability: "planned",
    suggestedPermissions: ["growth:write", "campaigns:write", "content:write"],
  },
  {
    id: "finance",
    label: "Financeiro",
    description: "Financeiro e indicadores — alinhado ao CosmoRole futuro.",
    availability: "planned",
    suggestedPermissions: ["finance:read", "finance:write", "dashboard:read"],
  },
];
