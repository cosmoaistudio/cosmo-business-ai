import type { DigitalPaymentIntent, DigitalPaymentSettings } from "../types/digitalPayment.types";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "../types/digitalPayment.types";
import type { PaymentMethod } from "@/features/pdv/types/sale";

const PAYMENT_SETTINGS_KEY = "cosmo:digital-payment-settings:";

export const digitalPaymentService = {
  loadSettings(organizationId: string): DigitalPaymentSettings {
    const raw = localStorage.getItem(`${PAYMENT_SETTINGS_KEY}${organizationId}`);
    if (!raw) return DEFAULT_DIGITAL_PAYMENT_SETTINGS;

    try {
      return { ...DEFAULT_DIGITAL_PAYMENT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_DIGITAL_PAYMENT_SETTINGS;
    }
  },

  saveSettings(organizationId: string, settings: DigitalPaymentSettings) {
    localStorage.setItem(
      `${PAYMENT_SETTINGS_KEY}${organizationId}`,
      JSON.stringify(settings)
    );
  },

  async createPaymentIntent(input: {
    method: PaymentMethod;
    amount: number;
    orderId: string;
    settings: DigitalPaymentSettings;
  }): Promise<DigitalPaymentIntent> {
    const id = crypto.randomUUID();

    if (input.method === "pix" && input.settings.pix.enabled) {
      return {
        id,
        provider: "pix",
        amount: input.amount,
        status: "pending",
        qrCodePayload: `PIX-COSMO-${input.orderId}`,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      };
    }

    if (
      (input.method === "credit_card" || input.method === "debit_card") &&
      input.settings.card.enabled
    ) {
      return {
        id,
        provider: "card",
        amount: input.amount,
        status: "processing",
        externalReference: input.orderId,
      };
    }

    if (input.settings.gateway.enabled) {
      return {
        id,
        provider: "gateway",
        amount: input.amount,
        status: "pending",
        externalReference: input.orderId,
      };
    }

    return {
      id,
      provider: "counter",
      amount: input.amount,
      status: "approved",
    };
  },

  /** Stub para integração futura com gateway externo */
  async confirmGatewayPayment(_intentId: string) {
    return { approved: false, message: "Gateway não configurado." };
  },
};
