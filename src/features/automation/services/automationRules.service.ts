import { automationRepository } from "../repository/automation.repository";
import type {
  AutomationRule,
  AutomationRuleWithLastLog,
  CreateAutomationRuleDTO,
  UpdateAutomationRuleDTO,
} from "../types/automationRule";

export const automationRulesService = {
  async getAll(): Promise<AutomationRuleWithLastLog[]> {
    const rules = await automationRepository.getAutomationRules();
    const lastLogs = await automationRepository.getLastLogsByRuleIds(
      rules.map((rule) => rule.id)
    );

    return rules.map((rule) => ({
      ...rule,
      last_log: lastLogs[rule.id] ?? null,
    }));
  },

  async getById(id: string) {
    return automationRepository.getAutomationRuleById(id);
  },

  async create(payload: CreateAutomationRuleDTO) {
    return automationRepository.createAutomationRule(payload);
  },

  async update(id: string, payload: UpdateAutomationRuleDTO) {
    return automationRepository.updateAutomationRule(id, payload);
  },

  async remove(id: string) {
    return automationRepository.deleteAutomationRule(id);
  },

  async duplicate(id: string) {
    return automationRepository.duplicateAutomationRule(id);
  },

  async toggleEnabled(rule: AutomationRule) {
    return automationRepository.updateAutomationRule(rule.id, {
      enabled: !rule.enabled,
    });
  },
};
