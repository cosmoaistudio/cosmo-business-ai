import type {
  DigitalMenuNiche,
  MenuThemeOverrides,
  NicheCopy,
  NicheFeatures,
} from "../menu/types/digitalMenu.types";
import type { MenuTemplateId } from "../menu/types/menuTemplate.types";

export type DigitalOrderMode = "dine_in" | "pickup" | "delivery" | "event";

export type DigitalQrCodeType =
  | "menu"
  | "table"
  | "pickup"
  | "delivery"
  | "event";

export interface DigitalStoreTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

/** Store-level copy overrides. Empty/omitted keys fall back to niche defaults. */
export type DigitalMenuCopyOverrides = Partial<NicheCopy>;

/** Store-level feature overrides. Empty/omitted keys fall back to niche defaults. */
export type DigitalMenuFeatureOverrides = Partial<NicheFeatures>;

export interface DigitalStoreSettings {
  slug: string;
  organizationId: string;
  organizationName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  welcomeMessage: string;
  /** Optional promo line rendered over the banner. Persisted in the settings jsonb. */
  bannerMessage: string | null;
  theme: DigitalStoreTheme;
  /** Cosmo Digital Menu niche. Persisted in the existing settings jsonb. */
  niche: DigitalMenuNiche;
  /** Extra Digital Menu theme tokens persisted in the existing theme jsonb. */
  menuTheme: MenuThemeOverrides;
  /**
   * Optional copy overrides (search placeholder, CTA labels, etc.).
   * Persisted in settings jsonb — only customized keys are stored.
   */
  menuCopy: DigitalMenuCopyOverrides;
  /**
   * Optional feature overrides (highlights, images, etc.).
   * Persisted in settings jsonb — only customized keys are stored.
   */
  menuFeatures: DigitalMenuFeatureOverrides;
  /**
   * Commercial template id (açaí, sushi, barbearia…).
   * Persisted in settings jsonb — no migration. Falls back to niche mapping.
   */
  menuTemplateId?: MenuTemplateId | null;
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
  bannerMessage: null,
  theme: DEFAULT_DIGITAL_STORE_THEME,
  niche: "generic",
  menuTheme: {},
  menuCopy: {},
  menuFeatures: {},
  menuTemplateId: "generic",
  acceptsPickup: true,
  acceptsDelivery: true,
  acceptsDineIn: true,
  minimumOrder: 0,
  deliveryFee: 0,
  averagePrepMinutes: 20,
  publishedAt: null,
};
