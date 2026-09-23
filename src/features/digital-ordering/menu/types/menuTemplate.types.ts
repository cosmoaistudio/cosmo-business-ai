import type {
  DigitalMenuNiche,
  MenuThemeOverrides,
  NicheCopy,
  NicheFeatures,
} from "../types/digitalMenu.types";

/**
 * Commercial template ids — product-facing names.
 * Persist in settings jsonb as `menuTemplateId` (no migration).
 */
export type MenuTemplateId =
  | "generic"
  | "acai"
  | "cafeteria"
  | "sushi"
  | "burger"
  | "icecream"
  | "pastel"
  | "marmita"
  | "barbershop"
  | "beauty"
  | "retail"
  | "services";

/** Presentation emphasis for product cards — no business logic. */
export type MenuCardEmphasis = "balanced" | "price" | "image" | "service";

/**
 * Capabilities are presentation flags only.
 * They never change checkout, pricing, or DigitalMenuProduct[].
 */
export interface MenuTemplateCapabilities {
  showHighlights: boolean;
  showPopular: boolean;
  showPromotions: boolean;
  showCombos: boolean;
  showOptionPreview: boolean;
  showSearch: boolean;
  showCategories: boolean;
  showProductImages: boolean;
  showDelivery: boolean;
  showPickup: boolean;
  cardEmphasis: MenuCardEmphasis;
}

export interface MenuTemplatePreviewMeta {
  /** Soft swatches for the admin picker card — not forced brand colors. */
  swatch: [string, string, string];
  tagline: string;
  /** Short commercial pitch for the template gallery. */
  pitch?: string;
  /** Visual style label shown in the gallery (e.g. "Vibrante", "Premium"). */
  styleLabel?: string;
  /** Human category for gallery filters (food / service / retail). */
  categoryLabel?: string;
  /** Short commercial tags for the gallery. */
  tags?: string[];
}

export interface MenuTemplateDefaults {
  /** Composition-first tokens. Soft color seeds are optional and overridable. */
  theme: MenuThemeOverrides;
  copy: Partial<NicheCopy>;
  features: Partial<NicheFeatures>;
}

export interface MenuTemplate {
  id: MenuTemplateId;
  name: string;
  description: string;
  /** Existing niche used for category suggestions + persistence compatibility. */
  niche: DigitalMenuNiche;
  defaultCategories: string[];
  preview: MenuTemplatePreviewMeta;
  defaults: MenuTemplateDefaults;
  capabilities: MenuTemplateCapabilities;
}

export interface MenuTemplateAppearance {
  templateId: MenuTemplateId;
  niche: DigitalMenuNiche;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  menuTheme: MenuThemeOverrides;
  menuCopy: Partial<NicheCopy>;
  menuFeatures: Partial<NicheFeatures>;
}
