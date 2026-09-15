import type { AutomationRule } from "@/features/automation/types/automationRule";

export function createAutomationRule(
  overrides: Partial<AutomationRule> = {}
): AutomationRule {
  return {
    id: "rule-1",
    organization_id: "org-1",
    name: "Pausar produto sem estoque",
    description: "Pausa produto quando estoque zera",
    trigger_type: "STOCK_CHANGED",
    enabled: true,
    conditions: [{ field: "quantity", operator: "lte", value: 0 }],
    actions: [{ type: "pause_product", params: { productId: "{{entityId}}" } }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
