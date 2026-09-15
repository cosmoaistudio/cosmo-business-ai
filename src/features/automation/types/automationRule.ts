export const AUTOMATION_MODULES = [
  "products",
  "inventory",
  "pdv",
  "customers",
  "finance",
  "orders",
  "system",
] as const;

export type AutomationModule = (typeof AUTOMATION_MODULES)[number];

export const AUTOMATION_ACTION_TYPES = [
  "PAUSE_PRODUCT",
  "ACTIVATE_PRODUCT",
  "PAUSE_OPTION",
  "ACTIVATE_OPTION",
  "SEND_NOTIFICATION",
  "CREATE_FINANCIAL_ENTRY",
  "CREATE_PURCHASE_SUGGESTION",
  "SEND_EMAIL",
  "SEND_WHATSAPP",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const CONDITION_OPERATORS = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "exists",
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export interface AutomationCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value?: string | number | boolean | null;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  module: AutomationModule;
  trigger_type: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationRuleWithLastLog extends AutomationRule {
  last_log?: {
    status: AutomationLogStatus;
    finished_at: string | null;
    execution_time: number | null;
  } | null;
}

export type CreateAutomationRuleDTO = {
  name: string;
  description?: string | null;
  module: AutomationModule;
  trigger_type: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled?: boolean;
  priority?: number;
};

export type UpdateAutomationRuleDTO = Partial<CreateAutomationRuleDTO>;

export type AutomationLogStatus = "success" | "failed" | "skipped";

export interface AutomationLog {
  id: string;
  organization_id: string;
  rule_id: string | null;
  status: AutomationLogStatus;
  started_at: string;
  finished_at: string | null;
  execution_time: number | null;
  payload: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  automation_rules?: Pick<AutomationRule, "id" | "name"> | null;
}

export interface AutomationLogsQueryParams {
  ruleId?: string;
  status?: AutomationLogStatus;
  limit?: number;
}
