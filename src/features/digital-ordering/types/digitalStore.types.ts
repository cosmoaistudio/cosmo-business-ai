export type DigitalOrderMode = "dine_in" | "pickup" | "delivery" | "event";

export type DigitalQrCodeType = "table" | "pickup" | "delivery" | "event";

export interface DigitalStoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

export interface DigitalStoreSettings {
  slug: string;
  organizationId: string;
  organizationName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  welcomeMessage: string;
  theme: DigitalStoreTheme;
  acceptsPickup: boolean;
  acceptsDelivery: boolean;
  acceptsDineIn: boolean;
  minimumOrder: number;
  deliveryFee: number;
  averagePrepMinutes: number;
  publishedAt: string | null;
}

export interface DigitalStoreTable {
  id: string;
  label: string;
  seats: number;
}

export interface DigitalQrCodeEntry {
  type: DigitalQrCodeType;
  label: string;
  url: string;
  tableId?: string;
}

export const DEFAULT_DIGITAL_STORE_THEME: DigitalStoreTheme = {
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  accentColor: "#38bdf8",
  backgroundColor: "#0f172a",
};

export const DEFAULT_DIGITAL_STORE_SETTINGS: Omit<
  DigitalStoreSettings,
  "slug" | "organizationId" | "organizationName"
> = {
  logoUrl: null,
  bannerUrl: null,
  welcomeMessage: "Faça seu pedido pelo celular. Rápido, fácil e sem fila.",
  theme: DEFAULT_DIGITAL_STORE_THEME,
  acceptsPickup: true,
  acceptsDelivery: true,
  acceptsDineIn: true,
  minimumOrder: 0,
  deliveryFee: 0,
  averagePrepMinutes: 20,
  publishedAt: null,
};
