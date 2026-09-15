import type { AutomationEventDetail } from "@/lib/automation-events";
import { onAutomationEvent } from "@/lib/automation-events";
import { automationRepository } from "../repository/automation.repository";
import { actionExecutor } from "./actionExecutor.service";
import { conditionEvaluator } from "./conditionEvaluator.service";
import type { AutomationRule } from "../types/automationRule";

let initialized = false;
let unsubscribe: (() => void) | null = null;
let processing = false;
const queue: AutomationEventDetail[] = [];

async function logExecution(params: {
  rule: AutomationRule | null;
  status: "success" | "failed" | "skipped";
  startedAt: Date;
  payload: Record<string, unknown>;
  errorMessage?: string;
}) {
  const finishedAt = new Date();

  await automationRepository.createAutomationLog({
    rule_id: params.rule?.id ?? null,
    status: params.status,
    started_at: params.startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    execution_time: finishedAt.getTime() - params.startedAt.getTime(),
    payload: params.payload,
    error_message: params.errorMessage ?? null,
  });
}

async function executeRule(
  rule: AutomationRule,
  event: AutomationEventDetail
) {
  const startedAt = new Date();
  const basePayload = {
    event: event.type,
    eventPayload: event.payload,
    ruleId: rule.id,
    ruleName: rule.name,
  };

  const conditionsMet = conditionEvaluator.evaluate(
    rule.conditions,
    event.payload
  );

  if (!conditionsMet) {
    await logExecution({
      rule,
      status: "skipped",
      startedAt,
      payload: {
        ...basePayload,
        reason: "Condições não satisfeitas",
        conditions: rule.conditions,
      },
    });
    return;
  }

  try {
    const results = await actionExecutor.execute(rule.actions, event.payload);
    const hasFailure = results.some((result) => !result.success);

    await logExecution({
      rule,
      status: hasFailure ? "failed" : "success",
      startedAt,
      payload: {
        ...basePayload,
        actionsExecuted: results,
      },
      errorMessage: hasFailure
        ? results
            .filter((result) => !result.success)
            .map((result) => result.message)
            .join("; ")
        : undefined,
    });
  } catch (error) {
    await logExecution({
      rule,
      status: "failed",
      startedAt,
      payload: basePayload,
      errorMessage:
        error instanceof Error ? error.message : "Erro ao executar automação",
    });
  }
}

async function processEvent(event: AutomationEventDetail) {
  const rules = await automationRepository.getAutomationRulesByTrigger(
    event.type
  );

  if (rules.length === 0) {
    return;
  }

  for (const rule of rules) {
    await executeRule(rule, event);
  }
}

async function drainQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      const event = queue.shift();
      if (!event) continue;

      try {
        await processEvent(event);
      } catch (error) {
        console.error("Erro no Cosmo Automation Engine:", error);

        await automationRepository.createAutomationLog({
          rule_id: null,
          status: "failed",
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          execution_time: 0,
          payload: {
            event: event.type,
            eventPayload: event.payload,
          },
          error_message:
            error instanceof Error
              ? error.message
              : "Erro interno do motor de automações",
        });
      }
    }
  } finally {
    processing = false;
  }
}

function enqueueEvent(event: AutomationEventDetail) {
  queue.push(event);
  void drainQueue();
}

export const automationEngine = {
  initialize() {
    if (initialized) {
      return () => automationEngine.shutdown();
    }

    initialized = true;
    unsubscribe = onAutomationEvent(enqueueEvent);

    return () => automationEngine.shutdown();
  },

  shutdown() {
    unsubscribe?.();
    unsubscribe = null;
    initialized = false;
    queue.length = 0;
  },

  async runEvent(event: AutomationEventDetail) {
    enqueueEvent(event);
  },

  async testRule(rule: AutomationRule, payload: Record<string, unknown>) {
    await executeRule(rule, {
      type: rule.trigger_type as AutomationEventDetail["type"],
      payload,
    });
  },
};
