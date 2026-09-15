export type {
  AutomationEventType,
  AutomationEventPayload,
} from "@/lib/automation-events";

export { AUTOMATION_EVENT_TYPES } from "@/lib/automation-events";

export interface AutomationEvent {
  type: import("@/lib/automation-events").AutomationEventType;
  payload: import("@/lib/automation-events").AutomationEventPayload;
  emittedAt: string;
}
