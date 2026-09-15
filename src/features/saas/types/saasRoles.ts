/**
 * Catálogo comercial de papéis — arquitetura apenas.
 * authRole mapeia para UserRole do auth quando availability = active.
 */

export const SAAS_ROLE_CATALOG_IDS = [
  "admin",
  "manager",
  "cashier",
  "kitchen",
  "marketing",
  "finance",
] as const;

export type SaasRoleCatalogId = (typeof SAAS_ROLE_CATALOG_IDS)[number];

export type SaasRoleAvailability = "active" | "planned";

export interface SaasRoleCatalogItem {
  id: SaasRoleCatalogId;
  label: string;
  description: string;
  availability: SaasRoleAvailability;
  /** Maps to auth UserRole when active */
  authRole?: "admin" | "manager" | "cashier" | "kitchen";
  suggestedPermissions: string[];
}
