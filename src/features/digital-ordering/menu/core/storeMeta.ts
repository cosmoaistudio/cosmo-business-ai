import { formatCurrency } from "@/lib/format";
import { DIGITAL_ORDER_MODE_LABELS } from "../../types/digitalOrdering.types";
import type {
  DigitalOrderMode,
  DigitalStoreSettings,
} from "../../types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_SETTINGS } from "../../types/digitalStore.types";
import { describePrepTime, type MenuStoreStatus } from "./storeStatus";

export type MenuStoreMetaKind = "eta" | "minimum";

export interface MenuStoreMetaItem {
  id: MenuStoreMetaKind;
  label: string;
  value: string;
}

/**
 * Presentation chips from data the store already has.
 * Opening hours are not modelled — never invent a schedule.
 */
export function buildStoreMetaItems(
  store: DigitalStoreSettings | null,
  mode: DigitalOrderMode,
  status?: MenuStoreStatus | null
): MenuStoreMetaItem[] {
  if (!store) return [];

  const items: MenuStoreMetaItem[] = [];
  const eta = describePrepTime(store.averagePrepMinutes);
  const showEta = Boolean(eta) && status?.availability !== "unpublished";

  if (showEta && eta) {
    items.push({
      id: "eta",
      label: DIGITAL_ORDER_MODE_LABELS[mode],
      value: eta,
    });
  }

  if (Number.isFinite(store.minimumOrder) && store.minimumOrder > 0) {
    items.push({
      id: "minimum",
      label: "Pedido mínimo",
      value: formatCurrency(store.minimumOrder),
    });
  }

  return items;
}

export function isDefaultWelcomeMessage(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return (
    trimmed.length === 0 ||
    trimmed === DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage
  );
}

export function hasCustomCatalogCopy(
  store: DigitalStoreSettings | null | undefined
): boolean {
  const copy = store?.menuCopy;
  if (!copy) return false;
  return Boolean(copy.catalogTitle?.trim() || copy.catalogSubtitle?.trim());
}
