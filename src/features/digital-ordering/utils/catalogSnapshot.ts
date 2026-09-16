import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import { toDigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";

const SNAPSHOT_PREFIX = "cosmo:digital-catalog:";

export function saveDigitalMenuSnapshot(
  organizationId: string,
  products: DigitalMenuProduct[]
) {
  localStorage.setItem(
    `${SNAPSHOT_PREFIX}${organizationId}`,
    JSON.stringify({ savedAt: new Date().toISOString(), products })
  );
}

export function saveCatalogSnapshot(
  organizationId: string,
  nodes: EngineProductNode[]
) {
  saveDigitalMenuSnapshot(
    organizationId,
    nodes.map((node) => toDigitalMenuProduct(node))
  );
}

export function loadCatalogSnapshot(organizationId: string): DigitalMenuProduct[] {
  const raw = localStorage.getItem(`${SNAPSHOT_PREFIX}${organizationId}`);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { products?: DigitalMenuProduct[] };
    return parsed.products ?? [];
  } catch {
    return [];
  }
}
