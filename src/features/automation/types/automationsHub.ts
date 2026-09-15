export const AUTOMATIONS_HUB_SECTIONS = [
  "overview",
  "library",
  "builder",
  "rules",
  "executions",
] as const;

export type AutomationsHubSectionId =
  (typeof AUTOMATIONS_HUB_SECTIONS)[number];

export type ExecutionDisplayStatus =
  | "running"
  | "success"
  | "failed"
  | "skipped";

export interface NodeFlowDraft {
  triggerKey: string | null;
  conditionSummary: string;
  actionKeys: string[];
}
