import { describe, expect, it } from "vitest";
import {
  USER_ROLES,
  DEFAULT_ROUTE_BY_ROLE,
  ROUTE_PERMISSIONS,
  canAccessRoute,
  getDefaultRouteForRole,
  hasOrganizationId,
  isUserRole,
  type AppRoute,
  type UserProfile,
} from "@/features/auth/types/roles";
import { permissionEngine } from "@/core/permission/PermissionEngine";

const ADMIN_ONLY: AppRoute[] = [
  "/configuracoes",
  "/configuracoes/pedido-digital",
  "/meu-plano",
  "/design-preview",
];

const ADMIN_MANAGER: AppRoute[] = [
  "/",
  "/operacoes",
  "/produtos",
  "/produtos/builder",
  "/estoque",
  "/financeiro",
  "/pedidos",
  "/opcoes/grupos",
  "/opcoes/itens",
  "/automacoes",
  "/ia",
  "/cerebro",
  "/crescimento",
  "/diagnostico",
  "/assistente",
  "/configuracoes/hardware",
];

const PDV_AND_CLIENTS: AppRoute[] = ["/pdv", "/clientes"];

describe("kitchen role — auth routes", () => {
  it("kitchen é role válida", () => {
    expect(USER_ROLES).toContain("kitchen");
    expect(isUserRole("kitchen")).toBe(true);
    expect(isUserRole("operator")).toBe(false);
  });

  it("DEFAULT_ROUTE_BY_ROLE.kitchen = /cozinha", () => {
    expect(DEFAULT_ROUTE_BY_ROLE.kitchen).toBe("/cozinha");
    expect(getDefaultRouteForRole("kitchen")).toBe("/cozinha");
  });

  it("kitchen consegue acessar /cozinha", () => {
    expect(canAccessRoute("kitchen", "/cozinha")).toBe(true);
    expect(ROUTE_PERMISSIONS["/cozinha"]).toContain("kitchen");
  });

  it("kitchen é bloqueado das rotas administrativas e PDV", () => {
    for (const path of [...ADMIN_ONLY, ...ADMIN_MANAGER, ...PDV_AND_CLIENTS]) {
      expect(canAccessRoute("kitchen", path), path).toBe(false);
    }
  });

  it("kitchen pode acessar /ajuda e /onboarding (gate de empresa)", () => {
    expect(canAccessRoute("kitchen", "/ajuda")).toBe(true);
    expect(canAccessRoute("kitchen", "/onboarding")).toBe(true);
  });

  it("cashier continua funcionando", () => {
    expect(getDefaultRouteForRole("cashier")).toBe("/pdv");
    expect(canAccessRoute("cashier", "/pdv")).toBe(true);
    expect(canAccessRoute("cashier", "/cozinha")).toBe(true);
    expect(canAccessRoute("cashier", "/")).toBe(false);
  });

  it("admin continua funcionando", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/");
    expect(canAccessRoute("admin", "/")).toBe(true);
    expect(canAccessRoute("admin", "/pdv")).toBe(true);
    expect(canAccessRoute("admin", "/cozinha")).toBe(true);
    expect(canAccessRoute("admin", "/configuracoes")).toBe(true);
  });

  it("manager continua funcionando", () => {
    expect(getDefaultRouteForRole("manager")).toBe("/");
    expect(canAccessRoute("manager", "/produtos")).toBe(true);
    expect(canAccessRoute("manager", "/cozinha")).toBe(true);
    expect(canAccessRoute("manager", "/configuracoes")).toBe(false);
  });

  it("tenant/organization_id continua obrigatório", () => {
    const withOrg: Pick<UserProfile, "organization_id"> = {
      organization_id: "org-loja-x",
    };
    expect(hasOrganizationId(withOrg)).toBe(true);
    expect(hasOrganizationId({ organization_id: "" })).toBe(false);
    expect(hasOrganizationId({ organization_id: "   " })).toBe(false);
    expect(hasOrganizationId(null)).toBe(false);
    expect(hasOrganizationId(undefined)).toBe(false);
  });
});

describe("kitchen role — PermissionEngine", () => {
  it("kitchen é ActiveCosmoRole", () => {
    expect(permissionEngine.isActiveRole("kitchen")).toBe(true);
    expect(permissionEngine.getDefaultRoute("kitchen")).toBe("/cozinha");
    expect(permissionEngine.canAccessRoute("kitchen", "/cozinha")).toBe(true);
    expect(permissionEngine.canAccessRoute("kitchen", "/pdv")).toBe(false);
  });
});
