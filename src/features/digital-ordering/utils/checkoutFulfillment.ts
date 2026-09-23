import type {
  DigitalOrderMode,
  DigitalStoreSettings,
} from "../types/digitalStore.types";

/** Fulfillment choices offered on the generic /menu checkout. */
export type CheckoutFulfillmentMode = Extract<
  DigitalOrderMode,
  "pickup" | "delivery"
>;

/**
 * Which fulfillment modes the store accepts for the public menu checkout.
 * Order: delivery first, then pickup (matches the UX mock).
 */
export function listCheckoutFulfillmentOptions(
  store: Pick<DigitalStoreSettings, "acceptsDelivery" | "acceptsPickup">
): CheckoutFulfillmentMode[] {
  const options: CheckoutFulfillmentMode[] = [];
  if (store.acceptsDelivery) options.push("delivery");
  if (store.acceptsPickup) options.push("pickup");
  return options;
}

/**
 * Initial mode for /menu checkout when the customer can choose fulfillment.
 * Prefers an available preferred mode, otherwise pickup, otherwise delivery.
 */
export function resolveInitialCheckoutFulfillment(
  store: Pick<DigitalStoreSettings, "acceptsDelivery" | "acceptsPickup">,
  preferred?: DigitalOrderMode | null
): CheckoutFulfillmentMode | null {
  const options = listCheckoutFulfillmentOptions(store);
  if (options.length === 0) return null;

  if (preferred === "delivery" && options.includes("delivery")) {
    return "delivery";
  }
  if (preferred === "pickup" && options.includes("pickup")) {
    return "pickup";
  }
  if (options.includes("pickup")) return "pickup";
  return options[0] ?? null;
}

/** True when the checkout should show Delivery/Retirada cards. */
export function shouldShowFulfillmentSelector(
  allowFulfillmentChoice: boolean,
  options: CheckoutFulfillmentMode[]
): boolean {
  return allowFulfillmentChoice && options.length > 1;
}
