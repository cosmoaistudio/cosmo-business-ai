import { toast } from "sonner";
import { financeService } from "@/features/finance/services/finance.service";
import { productsService } from "@/features/products/services/products.service";
import { productCompositionService } from "@/features/product-composition/services/productComposition.service";
import type { AutomationAction } from "../types/automationRule";
import type { AutomationEventPayload } from "@/lib/automation-events";

export interface ActionExecutionResult {
  actionId: string;
  type: string;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

function resolveTemplate(
  value: unknown,
  payload: AutomationEventPayload
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key: string) => {
    const parts = key.split(".");
    let current: unknown = payload;

    for (const part of parts) {
      if (current == null || typeof current !== "object") {
        return "";
      }

      current = (current as Record<string, unknown>)[part];
    }

    return current == null ? "" : String(current);
  });
}

function resolveParams(
  params: Record<string, unknown>,
  payload: AutomationEventPayload
) {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    resolved[key] = resolveTemplate(value, payload);
  }

  return resolved;
}

async function executeSingleAction(
  action: AutomationAction,
  payload: AutomationEventPayload
): Promise<ActionExecutionResult> {
  const params = resolveParams(action.params, payload);

  try {
    switch (action.type) {
      case "PAUSE_PRODUCT": {
        const productId = String(params.productId ?? payload.productId ?? payload.entityId ?? "");
        if (!productId) throw new Error("productId não informado");

        await productsService.update(productId, { status: "inactive" });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Produto pausado com sucesso",
          data: { productId },
        };
      }

      case "ACTIVATE_PRODUCT": {
        const productId = String(params.productId ?? payload.productId ?? payload.entityId ?? "");
        if (!productId) throw new Error("productId não informado");

        await productsService.update(productId, { status: "active" });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Produto ativado com sucesso",
          data: { productId },
        };
      }

      case "PAUSE_OPTION": {
        const optionId = String(params.optionId ?? payload.optionId ?? payload.entityId ?? "");
        if (!optionId) throw new Error("optionId não informado");

        await productCompositionService.updateOption(optionId, { active: false });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Opção pausada com sucesso",
          data: { optionId },
        };
      }

      case "ACTIVATE_OPTION": {
        const optionId = String(params.optionId ?? payload.optionId ?? payload.entityId ?? "");
        if (!optionId) throw new Error("optionId não informado");

        await productCompositionService.updateOption(optionId, { active: true });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Opção ativada com sucesso",
          data: { optionId },
        };
      }

      case "CREATE_FINANCIAL_ENTRY": {
        const amount = Number(params.amount ?? payload.amount ?? 0);
        const description = String(params.description ?? "Lançamento automático");
        const type = (params.type as "income" | "expense") ?? "income";
        const category = String(params.category ?? (type === "income" ? "other_income" : "other_expense"));

        if (amount <= 0) throw new Error("Valor financeiro inválido");

        await financeService.createTransaction({
          type,
          category: category as "other_income" | "other_expense",
          description,
          amount,
          transaction_date: new Date().toISOString().slice(0, 10),
          notes: "Gerado pelo Cosmo Automation Engine",
        });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Lançamento financeiro criado",
          data: { amount, description, type },
        };
      }

      case "SEND_NOTIFICATION": {
        const message = String(params.message ?? "Notificação de automação");
        toast.info(message, { description: "Cosmo Automation Engine" });

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Notificação enviada",
          data: { message },
        };
      }

      case "CREATE_PURCHASE_SUGGESTION": {
        const productName = String(params.productName ?? payload.productName ?? "Produto");
        const suggestedQty = Number(params.quantity ?? payload.quantity ?? 1);

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: "Sugestão de compra registrada",
          data: {
            productName,
            suggestedQty,
            note: "Sugestão registrada no log — integração de compras na v2.1",
          },
        };
      }

      case "SEND_EMAIL":
      case "SEND_WHATSAPP": {
        const recipient = String(params.to ?? params.recipient ?? "");
        const message = String(params.message ?? "");

        return {
          actionId: action.id,
          type: action.type,
          success: true,
          message: `${action.type} registrado (integração externa na v2.1)`,
          data: { recipient, message, queued: true },
        };
      }

      default:
        throw new Error(`Ação não suportada: ${action.type}`);
    }
  } catch (error) {
    return {
      actionId: action.id,
      type: action.type,
      success: false,
      message: error instanceof Error ? error.message : "Erro ao executar ação",
    };
  }
}

export async function executeActions(
  actions: AutomationAction[],
  payload: AutomationEventPayload
): Promise<ActionExecutionResult[]> {
  const results: ActionExecutionResult[] = [];

  for (const action of actions) {
    const result = await executeSingleAction(action, payload);
    results.push(result);
  }

  return results;
}

export const actionExecutor = {
  execute: executeActions,
};
