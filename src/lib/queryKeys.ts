/**
 * Canonical query-key factory for future React Query adoption on web.
 * Mobile already uses a compatible namespace under apps/mobile.
 *
 * Keep keys hierarchical: [scope, domain, ...params]
 */

export const queryKeys = {
  root: ["cosmo"] as const,
  dashboard: {
    all: ["cosmo", "dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },
  products: {
    all: ["cosmo", "products"] as const,
    list: () => [...queryKeys.products.all, "list"] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
  },
  finance: {
    all: ["cosmo", "finance"] as const,
    transactions: () => [...queryKeys.finance.all, "transactions"] as const,
  },
  kitchen: {
    all: ["cosmo", "kitchen"] as const,
    board: () => [...queryKeys.kitchen.all, "board"] as const,
  },
  customers: {
    all: ["cosmo", "customers"] as const,
    list: () => [...queryKeys.customers.all, "list"] as const,
  },
  cosmoAi: {
    all: ["cosmo", "ai"] as const,
    analysis: (organizationId: string | null) =>
      [...queryKeys.cosmoAi.all, "analysis", organizationId ?? "anon"] as const,
  },
  growthHub: {
    all: ["cosmo", "growth-hub"] as const,
    snapshot: () => [...queryKeys.growthHub.all, "snapshot"] as const,
    ideas: () => [...queryKeys.growthHub.all, "ideas"] as const,
  },
  businessBrain: {
    all: ["cosmo", "business-brain"] as const,
    snapshot: (organizationId: string | null) =>
      [
        ...queryKeys.businessBrain.all,
        "snapshot",
        organizationId ?? "anon",
      ] as const,
  },
  automations: {
    all: ["cosmo", "automations"] as const,
    rules: () => [...queryKeys.automations.all, "rules"] as const,
    logs: (status: string) =>
      [...queryKeys.automations.all, "logs", status] as const,
  },
  saas: {
    all: ["cosmo", "saas"] as const,
    subscription: (organizationId: string | null) =>
      [
        ...queryKeys.saas.all,
        "subscription",
        organizationId ?? "anon",
      ] as const,
    usage: (organizationId: string | null) =>
      [...queryKeys.saas.all, "usage", organizationId ?? "anon"] as const,
    diagnostics: () => [...queryKeys.saas.all, "diagnostics"] as const,
    onboarding: (organizationId: string | null) =>
      [
        ...queryKeys.saas.all,
        "onboarding",
        organizationId ?? "anon",
      ] as const,
  },
} as const;
