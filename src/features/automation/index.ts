export * from "./hooks/useAutomationRules";
export * from "./hooks/useAutomationLogs";
export * from "./hooks/useAutomationRuleEditor";
export * from "./hooks/useAutomationRuleActions";
export * from "./hooks/useAutomationsHub";
export * from "./hooks/useAutomationRulesQuery";
export * from "./hooks/useAutomationLogsQuery";

export type {
  AutomationRule,
  AutomationRuleWithLastLog,
  AutomationLog,
  AutomationLogStatus,
  AutomationModule,
  AutomationAction,
  AutomationCondition,
  AutomationActionType,
  CreateAutomationRuleDTO,
} from "./types/automationRule";

export type {
  AutomationsHubSectionId,
  ExecutionDisplayStatus,
  NodeFlowDraft,
} from "./types/automationsHub";

export type {
  AutomationEventType,
  AutomationEventPayload,
} from "@/lib/automation-events";

export {
  AUTOMATION_EVENT_TYPES,
} from "@/lib/automation-events";

export {
  AUTOMATION_MODULE_LABELS,
  AUTOMATION_EVENT_LABELS,
  AUTOMATION_ACTION_LABELS,
  EVENTS_BY_MODULE,
  formatExecutionTime,
} from "./utils/automationLabels";

export {
  ACTION_CATALOG,
  TRIGGER_CATALOG,
  findActionByKey,
  findTriggerByKey,
  getLiveActions,
  getLiveTriggers,
  getPlannedActions,
  getPlannedTriggers,
} from "./catalog";

export type {
  ActionCatalogItem,
  CatalogAvailability,
  CatalogConnectorTarget,
  TriggerCatalogItem,
} from "./catalog";

export { automationEngine } from "@/core/automation/AutomationEngine";
export { automationRulesService } from "./services/automationRules.service";
export { automationLogsService } from "./services/automationLogs.service";

export { AutomationEngineProvider } from "./providers/AutomationEngineProvider";
export { AutomationsProvider } from "./providers/AutomationsProvider";

export { AutomationsHubPage } from "./components/hub/AutomationsHubPage";
export { CatalogLibrary } from "./components/library/CatalogLibrary";
export { NodeFlowBuilder } from "./components/builder/NodeFlowBuilder";
export { ExecutionsPanel } from "./components/executions/ExecutionsPanel";
export { RulesPanel } from "./components/rules/RulesPanel";

export { default as RuleBuilder } from "./components/RuleBuilder";
export { default as ConditionBuilder } from "./components/ConditionBuilder";
export { default as ActionBuilder } from "./components/ActionBuilder";
export { default as AutomationCard } from "./components/AutomationCard";
export { default as AutomationStatusBadge } from "./components/AutomationStatusBadge";
export { default as AutomationLogTable } from "./components/AutomationLogTable";
export { default as DeleteAutomationRuleDialog } from "./components/DeleteAutomationRuleDialog";
