export const SAAS_PLAN_IDS = [
  "starter",
  "professional",
  "business",
  "enterprise",
] as const;

export type SaasPlanId = (typeof SAAS_PLAN_IDS)[number];

export interface SaasPlan {
  id: SaasPlanId;
  name: string;
  monthlyPriceBrl: number | null;
  description: string;
  highlighted?: boolean;
  /** null = ilimitado / sob consulta */
  limits: SaasPlanLimits;
}

export interface SaasPlanLimits {
  products: number | null;
  users: number | null;
  stores: number | null;
  ordersPerMonth: number | null;
  aiCreditsPerMonth: number | null;
  automations: number | null;
  contentPieces: number | null;
  campaigns: number | null;
}

export interface SaasSubscription {
  planId: SaasPlanId;
  status: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  monthlyPriceBrl: number | null;
  currency: "BRL";
  currentPeriodEnd: string | null;
  billingProvider: "none" | "stripe" | "mercadopago";
  externalSubscriptionId: string | null;
}

export interface SaasUsageSnapshot {
  products: number;
  users: number;
  stores: number;
  ordersThisMonth: number;
  aiCreditsUsed: number;
  automations: number;
  contentPieces: number;
  campaigns: number;
}
