import { supabase } from "@/config/supabase";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalPaymentSettings } from "../types/digitalPayment.types";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "../types/digitalPayment.types";
import type {
  DigitalQrCodeEntry,
  DigitalStoreSettings,
  DigitalStoreTable,
} from "../types/digitalStore.types";
import {
  buildDefaultSettings,
  mapPublicRpcToSettings,
  mapRowToSettings,
  mapTableRow,
  settingsToUpsertPayload,
  tablesToUpsertRows,
  type DigitalStoreRow,
  type PublicStoreRpc,
} from "../utils/digitalStoreMappers";
import { normalizeStoreSlug } from "../utils/storeSlug";

const CACHE_PREFIX = "cosmo:digital-store-cache:";
const TABLES_CACHE_PREFIX = "cosmo:digital-tables-cache:";
const MENU_CACHE_PREFIX = "cosmo:digital-menu-cache:";

function storeCacheKey(organizationId: string) {
  return `${CACHE_PREFIX}${organizationId}`;
}

function tablesCacheKey(organizationId: string) {
  return `${TABLES_CACHE_PREFIX}${organizationId}`;
}

function menuCacheKey(slug: string) {
  return `${MENU_CACHE_PREFIX}${normalizeStoreSlug(slug)}`;
}

function readCache<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_TABLES: DigitalStoreTable[] = [
  { id: "a1000001-0000-4000-8000-000000000001", label: "Mesa 1", seats: 4 },
  { id: "a1000001-0000-4000-8000-000000000002", label: "Mesa 2", seats: 4 },
  { id: "a1000001-0000-4000-8000-000000000003", label: "Mesa 3", seats: 6 },
  { id: "a1000001-0000-4000-8000-000000000004", label: "Mesa 4", seats: 2 },
];

async function fetchStoreRow(organizationId: string): Promise<DigitalStoreRow | null> {
  const result = await supabase
    .from("digital_stores")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data as DigitalStoreRow | null;
}

async function ensureStoreId(organizationId: string): Promise<string> {
  const row = await fetchStoreRow(organizationId);
  if (row?.id) return row.id;

  const defaults = buildDefaultSettings(organizationId, "Minha Loja");
  const payload = settingsToUpsertPayload(defaults, DEFAULT_DIGITAL_PAYMENT_SETTINGS, []);

  const insert = await supabase
    .from("digital_stores")
    .insert(payload)
    .select("id")
    .single();

  if (insert.error) throw insert.error;
  return insert.data.id as string;
}

export async function fetchDigitalStoreSettings(
  organizationId: string,
  organizationName: string
): Promise<DigitalStoreSettings> {
  try {
    const row = await fetchStoreRow(organizationId);

    if (row) {
      const settings = mapRowToSettings(row, organizationName);
      writeCache(storeCacheKey(organizationId), settings);
      return settings;
    }
  } catch {
    const cached = readCache<DigitalStoreSettings>(storeCacheKey(organizationId));
    if (cached) return { ...cached, organizationId, organizationName };
  }

  return buildDefaultSettings(organizationId, organizationName);
}

export async function upsertDigitalStoreSettings(
  settings: DigitalStoreSettings,
  paymentSettings: DigitalPaymentSettings,
  qrCodes: DigitalQrCodeEntry[],
  catalogSnapshot: DigitalMenuProduct[] = []
): Promise<DigitalStoreSettings> {
  const normalizedSlug = normalizeStoreSlug(settings.slug);
  const payload = settingsToUpsertPayload(
    { ...settings, slug: normalizedSlug, publishedAt: settings.publishedAt ?? new Date().toISOString() },
    paymentSettings,
    qrCodes,
    catalogSnapshot
  );

  const result = await supabase
    .from("digital_stores")
    .upsert(payload, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (result.error) throw result.error;

  const mapped = mapRowToSettings(result.data as DigitalStoreRow, settings.organizationName);
  writeCache(storeCacheKey(settings.organizationId), mapped);
  return mapped;
}

export async function fetchDigitalStoreBySlug(
  slug: string
): Promise<DigitalStoreSettings | null> {
  const normalized = normalizeStoreSlug(slug);

  try {
    const result = await supabase.rpc("get_public_digital_store", {
      p_slug: normalized,
    });

    if (result.error) throw result.error;
    if (!result.data) {
      return readCache<DigitalStoreSettings>(storeCacheKey(normalized));
    }

    const settings = mapPublicRpcToSettings(result.data as PublicStoreRpc);
    writeCache(storeCacheKey(settings.organizationId), settings);

    const tables = ((result.data as PublicStoreRpc).tables ?? []).map(mapTableRow);
    if (tables.length > 0) {
      writeCache(tablesCacheKey(settings.organizationId), tables);
    }

    return settings;
  } catch {
    return readCache<DigitalStoreSettings>(`${CACHE_PREFIX}slug:${normalized}`);
  }
}

export async function fetchDigitalStoreTables(
  organizationId: string
): Promise<DigitalStoreTable[]> {
  try {
    const storeRow = await fetchStoreRow(organizationId);
    if (!storeRow) return DEFAULT_TABLES;

    const result = await supabase
      .from("digital_store_tables")
      .select("id, label, seats, active, sort_order")
      .eq("store_id", storeRow.id)
      .eq("active", true)
      .order("sort_order");

    if (result.error) throw result.error;

    const tables = (result.data ?? []).map(mapTableRow);
    if (tables.length === 0) return DEFAULT_TABLES;

    writeCache(tablesCacheKey(organizationId), tables);
    return tables;
  } catch {
    return readCache<DigitalStoreTable[]>(tablesCacheKey(organizationId)) ?? DEFAULT_TABLES;
  }
}

export async function upsertDigitalStoreTables(
  organizationId: string,
  tables: DigitalStoreTable[]
): Promise<DigitalStoreTable[]> {
  const storeId = await ensureStoreId(organizationId);
  const rows = tablesToUpsertRows(organizationId, storeId, tables);

  const upsert = await supabase
    .from("digital_store_tables")
    .upsert(rows, { onConflict: "id" })
    .select("id, label, seats, active, sort_order");

  if (upsert.error) throw upsert.error;

  const saved = (upsert.data ?? []).map(mapTableRow);
  writeCache(tablesCacheKey(organizationId), saved);
  return saved;
}

export async function fetchPaymentSettingsFromStore(
  organizationId: string
): Promise<DigitalPaymentSettings> {
  try {
    const row = await fetchStoreRow(organizationId);
    const payment = row?.settings?.payment as DigitalPaymentSettings | undefined;
    if (payment) {
      return { ...DEFAULT_DIGITAL_PAYMENT_SETTINGS, ...payment };
    }
  } catch {
    // cache fallback below
  }

  return DEFAULT_DIGITAL_PAYMENT_SETTINGS;
}

export async function saveCatalogSnapshotToStore(
  organizationId: string,
  products: DigitalMenuProduct[]
): Promise<void> {
  const storeId = await ensureStoreId(organizationId);

  const result = await supabase
    .from("digital_stores")
    .update({
      catalog_snapshot: products,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (result.error) throw result.error;
}

export async function fetchPublicMenuBySlug(slug: string): Promise<DigitalMenuProduct[]> {
  const normalized = normalizeStoreSlug(slug);

  try {
    const result = await supabase.rpc("get_public_digital_menu", {
      p_slug: normalized,
    });

    if (result.error) throw result.error;

    const products = (result.data ?? []) as DigitalMenuProduct[];
    writeCache(menuCacheKey(normalized), products);
    return products;
  } catch {
    return readCache<DigitalMenuProduct[]>(menuCacheKey(normalized)) ?? [];
  }
}

export async function resolveOrganizationIdBySlug(slug: string): Promise<string | null> {
  const store = await fetchDigitalStoreBySlug(slug);
  return store?.organizationId ?? null;
}

/** @deprecated localStorage-only — use fetchDigitalStoreSettings */
export function loadDigitalStoreSettings(
  organizationId: string,
  organizationName: string
): DigitalStoreSettings {
  const cached = readCache<DigitalStoreSettings>(storeCacheKey(organizationId));
  return cached ?? buildDefaultSettings(organizationId, organizationName);
}

/** @deprecated localStorage-only — use fetchDigitalStoreBySlug */
export function loadDigitalStoreBySlug(_slug: string): DigitalStoreSettings | null {
  return null;
}

/** @deprecated localStorage-only — use fetchDigitalStoreTables */
export function loadDigitalStoreTables(_organizationId: string): DigitalStoreTable[] {
  return DEFAULT_TABLES;
}

/** @deprecated — use upsertDigitalStoreSettings */
export function saveDigitalStoreSettings(_settings: DigitalStoreSettings) {
  // no-op: persisted via upsertDigitalStoreSettings
}

/** @deprecated — use upsertDigitalStoreTables */
export function saveDigitalStoreTables(_organizationId: string, _tables: DigitalStoreTable[]) {
  // no-op: persisted via upsertDigitalStoreTables
}
