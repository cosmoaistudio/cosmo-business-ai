/**
 * Billing adapter architecture — no live gateway in SaaS V1.
 * Stripe and Mercado Pago implement the same contract later.
 */

export type BillingProviderId = "stripe" | "mercadopago";

export interface BillingCustomer {
  organizationId: string;
  email: string;
  name: string;
  externalCustomerId: string | null;
}

export interface CreateCheckoutInput {
  organizationId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  provider: BillingProviderId;
  checkoutUrl: string | null;
  status: "not_configured" | "ready";
  message: string;
}

export interface BillingProviderAdapter {
  readonly id: BillingProviderId;
  readonly label: string;
  isConfigured(): boolean;
  createCheckoutSession(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult>;
  openCustomerPortal(organizationId: string): Promise<{ url: string | null }>;
}
