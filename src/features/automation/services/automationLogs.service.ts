import { automationRepository } from "../repository/automation.repository";
import type { AutomationLogsQueryParams } from "../types/automationRule";

export const automationLogsService = {
  async getLogs(params: AutomationLogsQueryParams = {}) {
    return automationRepository.getAutomationLogs(params);
  },

  async getLogsByRule(ruleId: string, limit = 50) {
    return automationRepository.getAutomationLogs({ ruleId, limit });
  },
};
