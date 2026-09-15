import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { automationRulesService } from "../services/automationRules.service";
import type {
  AutomationAction,
  AutomationCondition,
  AutomationModule,
  AutomationRule,
  CreateAutomationRuleDTO,
} from "../types/automationRule";
import {
  createActionId,
  createConditionId,
} from "../utils/automationLabels";

const EMPTY_FORM: CreateAutomationRuleDTO = {
  name: "",
  description: "",
  module: "inventory",
  trigger_type: "STOCK_CHANGED",
  conditions: [],
  actions: [],
  enabled: true,
  priority: 0,
};

export function useAutomationRuleEditor(ruleId?: string) {
  const [form, setForm] = useState<CreateAutomationRuleDTO>(EMPTY_FORM);
  const [loading, setLoading] = useState(Boolean(ruleId));
  const [saving, setSaving] = useState(false);

  const loadRule = useCallback(async () => {
    if (!ruleId) {
      setForm(EMPTY_FORM);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rule = await automationRulesService.getById(ruleId);

      if (!rule) {
        toast.error("Automação não encontrada");
        return;
      }

      setForm({
        name: rule.name,
        description: rule.description ?? "",
        module: rule.module,
        trigger_type: rule.trigger_type,
        conditions: rule.conditions,
        actions: rule.actions,
        enabled: rule.enabled,
        priority: rule.priority,
      });
    } catch (error) {
      console.error("Erro ao carregar automação:", error);
      toast.error("Não foi possível carregar a automação.");
    } finally {
      setLoading(false);
    }
  }, [ruleId]);

  useEffect(() => {
    loadRule();
  }, [loadRule]);

  function setModule(module: AutomationModule) {
    setForm((current) => ({ ...current, module }));
  }

  function setTriggerType(triggerType: string) {
    setForm((current) => ({ ...current, trigger_type: triggerType }));
  }

  function setConditions(conditions: AutomationCondition[]) {
    setForm((current) => ({ ...current, conditions }));
  }

  function setActions(actions: AutomationAction[]) {
    setForm((current) => ({ ...current, actions }));
  }

  function addCondition() {
    setForm((current) => ({
      ...current,
      conditions: [
        ...current.conditions,
        {
          id: createConditionId(),
          field: "stock",
          operator: "lte",
          value: 5,
        },
      ],
    }));
  }

  function addAction(type: AutomationAction["type"] = "SEND_NOTIFICATION") {
    setForm((current) => ({
      ...current,
      actions: [
        ...current.actions,
        {
          id: createActionId(),
          type,
          params: getDefaultActionParams(type),
        },
      ],
    }));
  }

  async function save(onSuccess?: (rule: AutomationRule) => void) {
    if (!form.name.trim()) {
      toast.error("Informe o nome da automação");
      return null;
    }

    if (form.actions.length === 0) {
      toast.error("Adicione ao menos uma ação");
      return null;
    }

    try {
      setSaving(true);

      const payload: CreateAutomationRuleDTO = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
      };

      const result = ruleId
        ? await automationRulesService.update(ruleId, payload)
        : await automationRulesService.create(payload);

      toast.success(ruleId ? "Automação atualizada" : "Automação criada");
      onSuccess?.(result);
      return result;
    } catch (error) {
      toast.error(getErrorMessage(error, "Erro ao salvar automação"));
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    setForm,
    loading,
    saving,
    setModule,
    setTriggerType,
    setConditions,
    setActions,
    addCondition,
    addAction,
    save,
  };
}

function getDefaultActionParams(type: AutomationAction["type"]) {
  switch (type) {
    case "PAUSE_PRODUCT":
    case "ACTIVATE_PRODUCT":
      return { productId: "{{productId}}" };
    case "PAUSE_OPTION":
    case "ACTIVATE_OPTION":
      return { optionId: "{{optionId}}" };
    case "CREATE_FINANCIAL_ENTRY":
      return {
        type: "expense",
        category: "supplies",
        amount: 100,
        description: "Reposição automática de estoque",
      };
    case "CREATE_PURCHASE_SUGGESTION":
      return {
        productName: "{{productName}}",
        quantity: 10,
      };
    case "SEND_EMAIL":
      return { to: "", message: "Alerta do Cosmo Business AI" };
    case "SEND_WHATSAPP":
      return { to: "", message: "Alerta do Cosmo Business AI" };
    default:
      return { message: "Alerta de automação" };
  }
}
