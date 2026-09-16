import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalPaymentSettings } from "../types/digitalPayment.types";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "../types/digitalPayment.types";
import type {
  DigitalQrCodeEntry,
  DigitalStoreSettings,
  DigitalStoreTable,
  DigitalStoreTheme,
} from "../types/digitalStore.types";
import {
  DEFAULT_DIGITAL_STORE_SETTINGS,
  DEFAULT_DIGITAL_STORE_THEME,
} from "../types/digitalStore.types";
import { normalizeStoreSlug, slugFromOrganizationName } from "./storeSlug";
import { resolveNiche } from "../menu/config/nicheConfig";
import { parseMenuThemeOverrides } from "../menu/theme/menuTheme";

interface DigitalStoreRow {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  enabled: boolean;
  logo_url: string | null;
  banner_url: string | null;
  welcome_message: string;
  theme: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  qr_codes: DigitalQrCodeEntry[] | null;
  catalog_snapshot: DigitalMenuProduct[] | null;
  published_at: string | null;
}

interface DigitalStoreTableRow {
  id: string;
  label: string;
  seats: number;
  active: boolean;
  sort_order: number;
}

interface PublicStoreRpc {
  slug: string;
  organization_id: string;
  organization_name: string;
  logo_url: string | null;
  banner_url: string | null;
  welcome_message: string;
  theme: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  published_at: string | null;
  average_prep_minutes?: number;
  minimum_order?: number;
  delivery_fee?: number;
  accepts_pickup?: boolean;
  accepts_delivery?: boolean;
  accepts_dine_in?: boolean;
  tables?: DigitalStoreTableRow[];
}

function parseTheme(raw: Record<string, unknown> | null | undefined): DigitalStoreTheme {
  if (!raw) return DEFAULT_DIGITAL_STORE_THEME;

  return {
    primaryColor: String(raw.primaryColor ?? DEFAULT_DIGITAL_STORE_THEME.primaryColor),
    secondaryColor: String(raw.secondaryColor ?? DEFAULT_DIGITAL_STORE_THEME.secondaryColor),
    accentColor: String(raw.accentColor ?? DEFAULT_DIGITAL_STORE_THEME.accentColor),
    backgroundColor: String(raw.backgroundColor ?? DEFAULT_DIGITAL_STORE_THEME.backgroundColor),
  };
}

function parseStoreSettings(raw: Record<string, unknown> | null | undefined) {
  return {
    acceptsPickup: raw?.acceptsPickup !== false,
    acceptsDelivery: raw?.acceptsDelivery !== false,
    acceptsDineIn: raw?.acceptsDineIn !== false,
    minimumOrder: Number(raw?.minimumOrder ?? 0),
    deliveryFee: Number(raw?.deliveryFee ?? 0),
    averagePrepMinutes: Number(raw?.averagePrepMinutes ?? 20),
    niche: resolveNiche(raw?.niche),
    bannerMessage:
      typeof raw?.bannerMessage === "string" && raw.bannerMessage.trim().length > 0
        ? raw.bannerMessage.trim()
        : null,
    payment: (raw?.payment as DigitalPaymentSettings | undefined) ?? DEFAULT_DIGITAL_PAYMENT_SETTINGS,
  };
}

export function mapRowToSettings(
  row: DigitalStoreRow,
  organizationName: string
): DigitalStoreSettings {
  const parsed = parseStoreSettings(row.settings);

  return {
    slug: row.slug,
    organizationId: row.organization_id,
    organizationName: row.name || organizationName,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    welcomeMessage: row.welcome_message || DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage,
    bannerMessage: parsed.bannerMessage,
    theme: parseTheme(row.theme),
    niche: parsed.niche,
    menuTheme: parseMenuThemeOverrides(row.theme),
    acceptsPickup: parsed.acceptsPickup,
    acceptsDelivery: parsed.acceptsDelivery,
    acceptsDineIn: parsed.acceptsDineIn,
    minimumOrder: parsed.minimumOrder,
    deliveryFee: parsed.deliveryFee,
    averagePrepMinutes: parsed.averagePrepMinutes,
    publishedAt: row.published_at,
  };
}

export function mapPublicRpcToSettings(data: PublicStoreRpc): DigitalStoreSettings {
  const parsed = parseStoreSettings(data.settings);

  return {
    slug: data.slug,
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    logoUrl: data.logo_url,
    bannerUrl: data.banner_url,
    welcomeMessage: data.welcome_message || DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage,
    bannerMessage: parsed.bannerMessage,
    theme: parseTheme(data.theme),
    niche: parsed.niche,
    menuTheme: parseMenuThemeOverrides(data.theme),
    acceptsPickup: data.accepts_pickup ?? parsed.acceptsPickup,
    acceptsDelivery: data.accepts_delivery ?? parsed.acceptsDelivery,
    acceptsDineIn: data.accepts_dine_in ?? parsed.acceptsDineIn,
    minimumOrder: Number(data.minimum_order ?? parsed.minimumOrder),
    deliveryFee: Number(data.delivery_fee ?? parsed.deliveryFee),
    averagePrepMinutes: Number(data.average_prep_minutes ?? parsed.averagePrepMinutes),
    publishedAt: data.published_at,
  };
}

export function mapTableRow(row: DigitalStoreTableRow): DigitalStoreTable {
  return {
    id: row.id,
    label: row.label,
    seats: row.seats,
  };
}

export function buildDefaultSettings(
  organizationId: string,
  organizationName: string
): DigitalStoreSettings {
  return {
    ...DEFAULT_DIGITAL_STORE_SETTINGS,
    slug: slugFromOrganizationName(organizationName),
    organizationId,
    organizationName,
  };
}

/**
 * `catalogSnapshot` is intentionally optional: omitting the key preserves the
 * published catalog instead of overwriting it with an empty array. New rows
 * fall back to the column default of '[]'.
 */
export function settingsToUpsertPayload(
  settings: DigitalStoreSettings,
  paymentSettings: DigitalPaymentSettings,
  qrCodes: DigitalQrCodeEntry[],
  catalogSnapshot?: DigitalMenuProduct[]
) {
  return {
    // undefined → omit (preserve DB). Explicit [] → clear. Non-empty → write.
    ...(catalogSnapshot !== undefined
      ? { catalog_snapshot: catalogSnapshot }
      : {}),
    organization_id: settings.organizationId,
    slug: normalizeStoreSlug(settings.slug),
    name: settings.organizationName,
    enabled: true,
    logo_url: settings.logoUrl,
    banner_url: settings.bannerUrl,
    welcome_message: settings.welcomeMessage,
    // Digital Menu tokens ride along in the same jsonb column as the legacy colors.
    theme: { ...settings.theme, ...(settings.menuTheme ?? {}) },
    settings: {
      acceptsPickup: settings.acceptsPickup,
      acceptsDelivery: settings.acceptsDelivery,
      acceptsDineIn: settings.acceptsDineIn,
      minimumOrder: settings.minimumOrder,
      deliveryFee: settings.deliveryFee,
      averagePrepMinutes: settings.averagePrepMinutes,
      niche: resolveNiche(settings.niche),
      bannerMessage: settings.bannerMessage,
      payment: paymentSettings,
    },
    qr_codes: qrCodes,
    published_at: settings.publishedAt,
    updated_at: new Date().toISOString(),
  };
}

export function tablesToUpsertRows(
  organizationId: string,
  storeId: string,
  tables: DigitalStoreTable[]
) {
  return tables.map((table, index) => ({
    id: table.id,
    organization_id: organizationId,
    store_id: storeId,
    label: table.label,
    seats: table.seats,
    active: true,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));
}

export type { DigitalStoreRow, PublicStoreRpc };
