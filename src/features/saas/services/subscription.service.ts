import { getPlanById } from "../catalog/plans.catalog";
import type {
  SaasPlanId,
  SaasSubscription,
  SaasUsageSnapshot,
} from "../types/plans";

const STORAGE_KEY = "cosmo:saas:subscription";

function defaultSubscription(): SaasSubscription {
  const next = new Date();
  next.setDate(next.getDate() + 30);

  return {
    planId: "professional",
    status: "trialing",
    monthlyPriceBrl: 197,
    currency: "BRL",
    currentPeriodEnd: next.toISOString(),
    billingProvider: "none",
    externalSubscriptionId: null,
  };
}

function readStored(organizationId: string | null): SaasSubscription {
  if (!organizationId || typeof localStorage === "undefined") {
    return defaultSubscription();
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${organizationId}`);
    if (!raw) return defaultSubscription();
    return { ...defaultSubscription(), ...JSON.parse(raw) };
  } catch {
    return defaultSubscription();
  }
}

/**
 * Assinatura local (arquitetura). Sem gateway / sem tabela no banco.
 */
export const subscriptionService = {
  async getSubscription(organizationId: string | null): Promise<SaasSubscription> {
    const sub = readStored(organizationId);
    const plan = getPlanById(sub.planId);
    return {
      ...sub,
      monthlyPriceBrl: plan?.monthlyPriceBrl ?? sub.monthlyPriceBrl,
    };
  },

  async setPlan(
    organizationId: string | null,
    planId: SaasPlanId
  ): Promise<SaasSubscription> {
    const plan = getPlanById(planId);
    const next: SaasSubscription = {
      ...(await this.getSubscription(organizationId)),
      planId,
      monthlyPriceBrl: plan?.monthlyPriceBrl ?? null,
      status: "active",
      billingProvider: "none",
    };

    if (organizationId && typeof localStorage !== "undefined") {
      localStorage.setItem(
        `${STORAGE_KEY}:${organizationId}`,
        JSON.stringify(next)
      );
    }

    return next;
  },

  /**
   * Uso estimado para meters — placeholders até medidores server-side.
   * Não consulta tabelas novas; valores seguros para UI.
   */
  async getUsageSnapshot(): Promise<SaasUsageSnapshot> {
    return {
      products: 0,
      users: 1,
      stores: 1,
      ordersThisMonth: 0,
      aiCreditsUsed: 0,
      automations: 0,
      contentPieces: 0,
      campaigns: 0,
    };
  },
};
