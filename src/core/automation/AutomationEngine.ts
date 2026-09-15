import { automationEngine as featureAutomationEngine } from "@/features/automation/services/automationEngine.service";
import type { AutomationRule } from "@/features/automation/types/automationRule";
import type { LegacyAutomationEventType } from "../types/events";
import type { DomainEventPayload } from "../types/events";

/**
 * Facade do Cosmo Automation Engine no Core.
 * A implementação de regras permanece em features/automation;
 * o Core orquestra a inicialização e integração com o EventBus.
 */
export const automationEngine = {
  initialize() {
    return featureAutomationEngine.initialize();
  },

  shutdown() {
    featureAutomationEngine.shutdown();
  },

  async runEvent(
    type: LegacyAutomationEventType,
    payload: DomainEventPayload = {}
  ) {
    return featureAutomationEngine.runEvent({ type, payload });
  },

  async testRule(rule: AutomationRule, payload: Record<string, unknown>) {
    return featureAutomationEngine.testRule(rule, payload);
  },
};
