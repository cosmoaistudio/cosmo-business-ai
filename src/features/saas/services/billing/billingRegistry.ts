import type { BillingProviderAdapter, BillingProviderId } from "../../types/billing";
import { mercadoPagoBillingAdapter } from "./mercadoPagoAdapter";
import { stripeBillingAdapter } from "./stripeAdapter";

const adapters: Record<BillingProviderId, BillingProviderAdapter> = {
  stripe: stripeBillingAdapter,
  mercadopago: mercadoPagoBillingAdapter,
};

export function getBillingAdapter(id: BillingProviderId) {
  return adapters[id];
}

export function listBillingAdapters() {
  return Object.values(adapters);
}
