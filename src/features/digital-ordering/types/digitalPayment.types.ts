export type DigitalPaymentProvider = "pix" | "card" | "gateway" | "counter";

export type DigitalPaymentStatus =
  | "pending"
  | "processing"
  | "approved"
  | "declined"
  | "cancelled";

export interface DigitalPaymentIntent {
  id: string;
  provider: DigitalPaymentProvider;
  amount: number;
  status: DigitalPaymentStatus;
  externalReference?: string | null;
  qrCodePayload?: string | null;
  expiresAt?: string | null;
}

export interface DigitalGatewayConfig {
  enabled: boolean;
  providerName: string;
  publicKey?: string | null;
  webhookUrl?: string | null;
}

export interface DigitalPixConfig {
  enabled: boolean;
  keyType?: "cpf" | "cnpj" | "email" | "phone" | "random";
  key?: string | null;
}

export interface DigitalCardConfig {
  enabled: boolean;
  acceptCredit: boolean;
  acceptDebit: boolean;
}

export interface DigitalPaymentSettings {
  pix: DigitalPixConfig;
  card: DigitalCardConfig;
  gateway: DigitalGatewayConfig;
  allowPayAtCounter: boolean;
}

export const DEFAULT_DIGITAL_PAYMENT_SETTINGS: DigitalPaymentSettings = {
  pix: { enabled: true, keyType: "random", key: null },
  card: { enabled: false, acceptCredit: true, acceptDebit: true },
  gateway: { enabled: false, providerName: "Cosmo Gateway", publicKey: null },
  allowPayAtCounter: true,
};
