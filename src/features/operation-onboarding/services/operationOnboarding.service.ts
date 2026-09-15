import { supabase } from "@/config/supabase";
import { productsService } from "@/features/products";
import { productCompositionService } from "@/features/product-composition";
import type { OperationSetupSignals, OperationSetupStatus } from "../types";
import { getOperationSetupStatus } from "../utils/getOperationSetupStatus";

function isActiveProductWithCategory(product: {
  status?: string | null;
  category?: string | null;
}): boolean {
  return (
    product.status === "active" && Boolean(product.category?.trim())
  );
}

/**
 * Digital order is configured only with a persisted digital_stores row that is
 * enabled, published, and has a non-empty catalog snapshot.
 */
async function fetchDigitalOrderConfigured(
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("digital_stores")
    .select("id, enabled, published_at, catalog_snapshot")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  const snapshot = data.catalog_snapshot;
  const hasCatalog = Array.isArray(snapshot) && snapshot.length > 0;

  return Boolean(data.enabled && data.published_at && hasCatalog);
}

async function fetchHasFirstSale(): Promise<boolean> {
  const { count, error } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function loadOperationSetupSignals(
  _organizationId: string
): Promise<OperationSetupSignals> {
  const [products, optionGroupsPage, digitalConfigured, hasFirstSale] =
    await Promise.all([
      productsService.getAll(),
      productCompositionService.getOptionGroupsPaginated({
        page: 1,
        pageSize: 1,
      }),
      fetchDigitalOrderConfigured(_organizationId),
      fetchHasFirstSale(),
    ]);

  const hasFirstProductReady = products.some(isActiveProductWithCategory);
  const hasActiveProductWithoutCategory = products.some(
    (product) =>
      product.status === "active" && !product.category?.trim()
  );
  const hasAddonGroup = (optionGroupsPage.total ?? 0) > 0;
  const hasMenuReady = hasFirstProductReady;

  return {
    hasFirstProductReady,
    hasActiveProductWithoutCategory,
    hasAddonGroup,
    hasMenuReady,
    hasDigitalOrderConfigured: digitalConfigured,
    hasFirstSale,
  };
}

export async function loadOperationSetupStatus(
  organizationId: string
): Promise<OperationSetupStatus> {
  const signals = await loadOperationSetupSignals(organizationId);
  return getOperationSetupStatus(signals);
}

export const operationOnboardingService = {
  loadSignals: loadOperationSetupSignals,
  loadStatus: loadOperationSetupStatus,
};
