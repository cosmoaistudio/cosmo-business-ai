import type {
  BillingProviderAdapter,
  CreateCheckoutInput,
  CreateCheckoutResult,
} from "../../types/billing";

/**
 * Stripe adapter — contract only. No SDK / keys in SaaS V1.
 */
export const stripeBillingAdapter: BillingProviderAdapter = {
  id: "stripe",
  label: "Stripe",
  isConfigured() {
    return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  },
  async createCheckoutSession(
    _input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    return {
      provider: "stripe",
      checkoutUrl: null,
      status: "not_configured",
      message:
        "Stripe preparado na arquitetura. Integração de checkout será ligada em sprint comercial.",
    };
  },
  async openCustomerPortal(_organizationId: string) {
    return { url: null };
  },
};
