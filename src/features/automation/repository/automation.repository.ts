import { supabase } from "@/config/supabase";
import type {
  AutomationLog,
  AutomationLogStatus,
  AutomationLogsQueryParams,
  AutomationRule,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
} from "../types/automationRule";

function parseRule(row: AutomationRule): AutomationRule {
  return {
    ...row,
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    actions: Array.isArray(row.actions) ? row.actions : [],
  };
}

export async function getAutomationRules() {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as AutomationRule[]).map(parseRule);
}

export async function getAutomationRulesByTrigger(triggerType: string) {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("trigger_type", triggerType)
    .eq("enabled", true)
    .order("priority", { ascending: true });

  if (error) throw error;
  return (data as AutomationRule[]).map(parseRule);
}

export async function getAutomationRuleById(id: string) {
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return parseRule(data as AutomationRule);
}

export async function createAutomationRule(payload: CreateAutomationRuleDTO) {
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      module: payload.module,
      trigger_type: payload.trigger_type,
      conditions: payload.conditions,
      actions: payload.actions,
      enabled: payload.enabled ?? true,
      priority: payload.priority ?? 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return parseRule(data as AutomationRule);
}

export async function updateAutomationRule(
  id: string,
  payload: UpdateAutomationRuleDTO
) {
  const { data, error } = await supabase
    .from("automation_rules")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return parseRule(data as AutomationRule);
}

export async function deleteAutomationRule(id: string) {
  const { error } = await supabase
    .from("automation_rules")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function duplicateAutomationRule(id: string) {
  const rule = await getAutomationRuleById(id);
  if (!rule) throw new Error("Regra não encontrada");

  return createAutomationRule({
    name: `${rule.name} (cópia)`,
    description: rule.description,
    module: rule.module,
    trigger_type: rule.trigger_type,
    conditions: rule.conditions,
    actions: rule.actions,
    enabled: false,
    priority: rule.priority + 1,
  });
}

export async function createAutomationLog(payload: {
  rule_id?: string | null;
  status: AutomationLogStatus;
  started_at: string;
  finished_at?: string | null;
  execution_time?: number | null;
  payload?: Record<string, unknown>;
  error_message?: string | null;
}) {
  const { data, error } = await supabase
    .from("automation_logs")
    .insert({
      rule_id: payload.rule_id ?? null,
      status: payload.status,
      started_at: payload.started_at,
      finished_at: payload.finished_at ?? null,
      execution_time: payload.execution_time ?? null,
      payload: payload.payload ?? {},
      error_message: payload.error_message ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as AutomationLog;
}

export async function getAutomationLogs(params: AutomationLogsQueryParams = {}) {
  const limit = params.limit ?? 50;

  let query = supabase
    .from("automation_logs")
    .select("*, automation_rules(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.ruleId) {
    query = query.eq("rule_id", params.ruleId);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AutomationLog[];
}

export async function getLastLogsByRuleIds(ruleIds: string[]) {
  if (ruleIds.length === 0) return {};

  const { data, error } = await supabase
    .from("automation_logs")
    .select("rule_id, status, finished_at, execution_time, created_at")
    .in("rule_id", ruleIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const map: Record<
    string,
    {
      status: AutomationLogStatus;
      finished_at: string | null;
      execution_time: number | null;
    }
  > = {};

  for (const log of data ?? []) {
    if (!log.rule_id || map[log.rule_id]) continue;
    map[log.rule_id] = {
      status: log.status as AutomationLogStatus,
      finished_at: log.finished_at,
      execution_time: log.execution_time,
    };
  }

  return map;
}

export const automationRepository = {
  getAutomationRules,
  getAutomationRulesByTrigger,
  getAutomationRuleById,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  duplicateAutomationRule,
  createAutomationLog,
  getAutomationLogs,
  getLastLogsByRuleIds,
};
