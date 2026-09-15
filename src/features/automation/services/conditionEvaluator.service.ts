import type {
  AutomationCondition,
  ConditionOperator,
} from "../types/automationRule";
import type { AutomationEventPayload } from "@/lib/automation-events";

function getNestedValue(
  payload: AutomationEventPayload,
  field: string
): unknown {
  if (field in payload) {
    return payload[field];
  }

  const parts = field.split(".");
  let current: unknown = payload;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function compareValues(
  left: unknown,
  operator: ConditionOperator,
  right: unknown
): boolean {
  switch (operator) {
    case "exists":
      return left !== undefined && left !== null;

    case "eq":
      return String(left) === String(right);

    case "neq":
      return String(left) !== String(right);

    case "contains":
      return String(left ?? "")
        .toLowerCase()
        .includes(String(right ?? "").toLowerCase());

    case "gt":
      return Number(left) > Number(right);

    case "gte":
      return Number(left) >= Number(right);

    case "lt":
      return Number(left) < Number(right);

    case "lte":
      return Number(left) <= Number(right);

    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: AutomationCondition[],
  payload: AutomationEventPayload
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => {
    const value = getNestedValue(payload, condition.field);
    return compareValues(value, condition.operator, condition.value);
  });
}

export const conditionEvaluator = {
  evaluate: evaluateConditions,
};
