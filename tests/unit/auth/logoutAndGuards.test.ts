import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  getDefaultRouteForRole,
  type AppRoute,
} from "@/features/auth/types/roles";
import {
  resolveGuestRouteAccess,
  resolvePrivateRouteAccess,
} from "@/features/auth/utils/authGate";
import {
  resolveAppStartupState,
  resolvePostAuthPath,
} from "@/features/auth/utils/appStartup";
import {
  setAcceptDesktopOAuthCallbacks,
  shouldAcceptDesktopOAuthCallbacks,
} from "@/features/auth/oauth/oauthAcceptGate";

const PRIVATE_ROUTES: AppRoute[] = [
  "/",
  "/operacoes",
  "/produtos",
  "/estoque",
  "/pdv",
  "/financeiro",
  "/pedidos",
  "/cozinha",
  "/clientes",
  "/automacoes",
  "/configuracoes",
  "/configuracoes/hardware",
];

const incompleteOrg = {
  onboarding_completed: false,
  name: "Minha Empresa",
};

const readyOrg = {
  onboarding_completed: true,
  name: "Rede Açaí",
};

describe("logout / proteção de rotas", () => {
  it("sem sessão → rota privada resolve para login", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: false,
        hasUser: false,
        hasProfile: false,
        path: "/cozinha",
      })
    ).toBe("login");
  });

  it("loading → não libera conteúdo privado", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: true,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        organization: readyOrg,
        path: "/",
      })
    ).toBe("loading");
  });

  it("autenticado com profile e onboarding completo → allow", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        role: "admin",
        organization: readyOrg,
        path: "/",
      })
    ).toBe("allow");
  });

  it("autenticado sem profile → no-profile (não área privada)", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: false,
        userId: "u1",
        path: "/",
      })
    ).toBe("no-profile");
  });

  it("guest deslogado vê login; logado pronto redireciona ao app", () => {
    expect(
      resolveGuestRouteAccess({
        loading: false,
        hasSessionUser: false,
        hasUser: false,
        hasProfile: false,
        isPasswordReset: false,
      })
    ).toBe("show-login");

    expect(
      resolveGuestRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        isPasswordReset: false,
        userId: "u1",
        organizationId: "o1",
        organization: readyOrg,
      })
    ).toBe("redirect-app");
  });

  it("sem role → default é /login (nunca /cozinha)", () => {
    expect(getDefaultRouteForRole(null)).toBe("/login");
    expect(getDefaultRouteForRole(undefined)).toBe("/login");
  });

  it("usuário sem sessão não acessa nenhuma rota privada por role", () => {
    for (const path of PRIVATE_ROUTES) {
      expect(canAccessRoute(null, path), path).toBe(false);
    }
  });

  it("kitchen autenticado só /cozinha e /ajuda; após logout perde acesso", () => {
    expect(canAccessRoute("kitchen", "/cozinha")).toBe(true);
    expect(canAccessRoute("kitchen", "/pdv")).toBe(false);
    expect(canAccessRoute("kitchen", "/")).toBe(false);
    expect(getDefaultRouteForRole("kitchen")).toBe("/cozinha");

    expect(canAccessRoute(null, "/cozinha")).toBe(false);
    expect(getDefaultRouteForRole(null)).toBe("/login");
  });

  it("após limpar auth, guest não redireciona para app", () => {
    expect(
      resolveGuestRouteAccess({
        loading: false,
        hasSessionUser: false,
        hasUser: false,
        hasProfile: false,
        isPasswordReset: false,
      })
    ).toBe("show-login");
  });
});

describe("company onboarding startup / gates", () => {
  it("usuário sem sessão → guest → /login", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: false,
      hasUser: false,
      hasProfile: false,
    });
    expect(startup.status).toBe("guest");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/" })).toBe(
      "/login"
    );
  });

  it("autenticado sem empresa → needs_onboarding → /onboarding", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: null,
      organization: null,
    });
    expect(startup.status).toBe("needs_onboarding");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/cozinha" })).toBe(
      "/onboarding"
    );
  });

  it("autenticado com onboarding pendente → /onboarding (não /cozinha)", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: incompleteOrg,
    });
    expect(startup.status).toBe("needs_onboarding");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/cozinha" })).toBe(
      "/onboarding"
    );

    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        role: "admin",
        organization: incompleteOrg,
        path: "/cozinha",
      })
    ).toBe("onboarding");

    expect(
      resolveGuestRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        isPasswordReset: false,
        userId: "u1",
        organizationId: "o1",
        organization: incompleteOrg,
      })
    ).toBe("redirect-onboarding");
  });

  it("usuário pronto → /dashboard (role default /)", () => {
    const startup = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: readyOrg,
    });
    expect(startup.status).toBe("ready");
    expect(resolvePostAuthPath({ startup, roleDefaultPath: "/" })).toBe("/");
  });

  it("não ocorre redirect automático para /cozinha quando onboarding pendente", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        role: "kitchen",
        organization: incompleteOrg,
        path: "/cozinha",
      })
    ).toBe("onboarding");

    expect(
      resolveGuestRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        isPasswordReset: false,
        userId: "u1",
        organizationId: "o1",
        role: "kitchen",
        organization: incompleteOrg,
      })
    ).not.toBe("redirect-app");
  });

  it("pronto em /onboarding → redireciona dashboard", () => {
    expect(
      resolvePrivateRouteAccess({
        loading: false,
        hasSessionUser: true,
        hasUser: true,
        hasProfile: true,
        userId: "u1",
        organizationId: "o1",
        role: "admin",
        organization: readyOrg,
        path: "/onboarding",
      })
    ).toBe("redirect-dashboard");
  });

  it("logout limpa aceite de deep link OAuth (Electron)", () => {
    setAcceptDesktopOAuthCallbacks(true);
    expect(shouldAcceptDesktopOAuthCallbacks()).toBe(true);
    setAcceptDesktopOAuthCallbacks(false);
    expect(shouldAcceptDesktopOAuthCallbacks()).toBe(false);
    setAcceptDesktopOAuthCallbacks(true);
    expect(shouldAcceptDesktopOAuthCallbacks()).toBe(true);
  });

  it("login Google Electron segue bootstrap: sessão → startup (não /cozinha direto)", () => {
    // Após exchangeCodeForSession, AuthProvider fica loading até profile;
    // só então GuestRoute decide pelo startup.
    expect(
      resolveAppStartupState({
        loading: true,
        hasSessionUser: true,
        hasUser: true,
        userId: "u1",
        hasProfile: false,
      }).status
    ).toBe("loading");

    const afterProfileIncomplete = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: incompleteOrg,
    });
    expect(afterProfileIncomplete.status).toBe("needs_onboarding");
    expect(
      resolvePostAuthPath({
        startup: afterProfileIncomplete,
        roleDefaultPath: getDefaultRouteForRole("admin"),
      })
    ).toBe("/onboarding");

    const afterReady = resolveAppStartupState({
      loading: false,
      hasSessionUser: true,
      hasUser: true,
      userId: "u1",
      hasProfile: true,
      organizationId: "o1",
      role: "admin",
      organization: readyOrg,
    });
    expect(
      resolvePostAuthPath({
        startup: afterReady,
        roleDefaultPath: getDefaultRouteForRole("admin"),
      })
    ).toBe("/");
  });
});
