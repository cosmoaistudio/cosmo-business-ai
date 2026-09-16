import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { normalizeStoreSlug } from "./storeSlug";

export interface PersistedStoreSnapshotRow {
  id?: string | null;
  slug?: string | null;
  organization_id?: string | null;
  catalog_snapshot?: unknown;
  published_at?: string | null;
}

export interface ValidatePersistedCatalogInput {
  expectedProductCount: number;
  expectedSlug?: string | null;
  expectedOrganizationId?: string | null;
  persisted: PersistedStoreSnapshotRow | null | undefined;
}

/**
 * Pure guard used after UPDATE … RETURNING / .select().
 * Fails closed: toast must never celebrate a miss.
 */
export function validatePersistedCatalogSnapshot(
  input: ValidatePersistedCatalogInput
): DigitalMenuProduct[] {
  const { expectedProductCount, expectedSlug, expectedOrganizationId, persisted } =
    input;

  if (!persisted?.id) {
    throw new Error(
      "Não foi possível publicar o cardápio: nenhuma loja digital foi atualizada."
    );
  }

  if (expectedOrganizationId) {
    const persistedOrg = String(persisted.organization_id ?? "");
    if (persistedOrg !== expectedOrganizationId) {
      throw new Error(
        "Não foi possível publicar o cardápio: a loja atualizada não pertence à organização atual."
      );
    }
  }

  if (expectedSlug) {
    const expected = normalizeStoreSlug(expectedSlug);
    const actual = normalizeStoreSlug(String(persisted.slug ?? ""));
    if (!actual || actual !== expected) {
      throw new Error(
        `Não foi possível publicar o cardápio: a loja gravada tem slug "${persisted.slug ?? ""}", esperado "${expectedSlug}". Salve o slug nas configurações e publique novamente.`
      );
    }
  }

  if (!persisted.published_at) {
    throw new Error(
      "Não foi possível publicar o cardápio: published_at não foi atualizado."
    );
  }

  const saved = Array.isArray(persisted.catalog_snapshot)
    ? (persisted.catalog_snapshot as DigitalMenuProduct[])
    : [];

  if (expectedProductCount <= 0) {
    throw new Error("Nenhum produto disponível para publicar.");
  }

  if (saved.length === 0) {
    throw new Error(
      "Não foi possível publicar o cardápio: o snapshot persistido ficou vazio."
    );
  }

  if (saved.length !== expectedProductCount) {
    throw new Error(
      `Publicação incompleta: enviados ${expectedProductCount} produtos, persistidos ${saved.length}.`
    );
  }

  return saved;
}

/** True when upsert must omit catalog_snapshot so an existing menu is not wiped. */
export function shouldOmitCatalogSnapshotFromUpsert(
  catalogSnapshot: DigitalMenuProduct[] | undefined
): boolean {
  return catalogSnapshot === undefined;
}
