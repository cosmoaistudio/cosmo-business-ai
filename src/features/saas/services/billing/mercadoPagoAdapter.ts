import type {
  BillingProviderAdapter,
  CreateCheckoutInput,
  CreateCheckoutResult,
} from "../../types/billing";

/**
 * Mercado Pago adapter — contract only. No SDK / keys in SaaS V1.
 */
export const mercadoPagoBillingAdapter: BillingProviderAdapter = {
  id: "mercadopago",
  label: "Mercado Pago",
  isConfigured() {
    return Boolean(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);
  },
  async createCheckoutSession(
    _input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    return {
      provider: "mercadopago",
      checkoutUrl: null,
      status: "not_configured",
      message:
        "Mercado Pago preparado na arquitetura. Checkout será ligado sem mudar o restante do SaaS.",
    };
  },
  async openCustomerPortal(_organizationId: string) {
    return { url: null };
  },
};
