import type { KitchenStatus } from "@/features/kitchen-display/types/kitchenDisplay.types";
import type { DigitalOrderStatusStep } from "../types/digitalOrdering.types";

export const ORDER_TIMELINE_STEPS: DigitalOrderStatusStep[] = [
  "received",
  "accepted",
  "preparing",
  "ready",
  "delivered",
];

const KITCHEN_TO_DIGITAL: Record<KitchenStatus, DigitalOrderStatusStep> = {
  pending: "received",
  accepted: "accepted",
  preparing: "preparing",
  ready: "ready",
  delivered: "delivered",
  cancelled: "delivered",
};

export function mapKitchenStatusToDigital(
  status: KitchenStatus | string
): DigitalOrderStatusStep {
  if (status in KITCHEN_TO_DIGITAL) {
    return KITCHEN_TO_DIGITAL[status as KitchenStatus];
  }
  if (status === "pending") return "received";
  if (status === "cancelled") return "delivered";
  return "received";
}

export function getTimelineProgress(current: DigitalOrderStatusStep) {
  const index = ORDER_TIMELINE_STEPS.indexOf(current);
  return ORDER_TIMELINE_STEPS.map((step, stepIndex) => ({
    step,
    completed: stepIndex <= index,
    active: stepIndex === index,
  }));
}

export function isOrderReady(status: DigitalOrderStatusStep) {
  return status === "ready" || status === "delivered";
}
