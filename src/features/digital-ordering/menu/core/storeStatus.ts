import type {
  DigitalOrderMode,
  DigitalStoreSettings,
} from "../../types/digitalStore.types";
import { DIGITAL_ORDER_MODE_LABELS } from "../../types/digitalOrdering.types";

export type MenuStoreAvailability =
  | "open"
  | "mode_unavailable"
  | "unpublished"
  | "unknown";

export type MenuStoreTone = "positive" | "warning" | "neutral";

export interface MenuStoreStatus {
  availability: MenuStoreAvailability;
  isAcceptingOrders: boolean;
  label: string;
  detail: string | null;
  tone: MenuStoreTone;
}

/** Whether the store accepts a given mode, based on the existing flags. */
export function acceptsMode(
  store: DigitalStoreSettings,
  mode: DigitalOrderMode
): boolean {
  switch (mode) {
    case "dine_in":
      return store.acceptsDineIn;
    case "pickup":
      return store.acceptsPickup;
    case "delivery":
      return store.acceptsDelivery;
    case "event":
      // Events are QR-driven and not gated by a store flag.
      return true;
    default:
      return true;
  }
}

export function describePrepTime(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `~${Math.round(minutes)} min`;

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `~${hours} h` : `~${hours} h ${rest} min`;
}

/**
 * Derived from data the store already has: publication state and the accepted
 * modes. Opening hours are not modelled yet, so this never claims a schedule.
 */
export function resolveStoreStatus(
  store: DigitalStoreSettings | null,
  mode: DigitalOrderMode
): MenuStoreStatus {
  if (!store) {
    return {
      availability: "unknown",
      isAcceptingOrders: false,
      label: "Indisponível",
      detail: null,
      tone: "neutral",
    };
  }

  if (!store.publishedAt) {
    return {
      availability: "unpublished",
      isAcceptingOrders: false,
      label: "Loja em configuração",
      detail: "Este cardápio ainda não foi publicado.",
      tone: "warning",
    };
  }

  if (!acceptsMode(store, mode)) {
    const modeLabel = DIGITAL_ORDER_MODE_LABELS[mode];

    return {
      availability: "mode_unavailable",
      isAcceptingOrders: false,
      label: `${modeLabel} indisponível`,
      detail: `A loja não está aceitando pedidos para ${modeLabel.toLowerCase()}.`,
      tone: "warning",
    };
  }

  return {
    availability: "open",
    isAcceptingOrders: true,
    label: "Aceitando pedidos",
    detail: describePrepTime(store.averagePrepMinutes),
    tone: "positive",
  };
}
