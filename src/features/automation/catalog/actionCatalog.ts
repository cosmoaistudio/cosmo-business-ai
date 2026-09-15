import type { ActionCatalogItem } from "./types";

/**
 * Ações — biblioteca separada dos gatilhos.
 * `live` = implementadas no actionExecutor (comportamento atual intacto).
 * `planned` = conectores futuros entre módulos (sem execução nesta sprint).
 */
export const ACTION_CATALOG: ActionCatalogItem[] = [
  {
    id: "send-notification",
    actionKey: "SEND_NOTIFICATION",
    label: "Enviar notificação",
    description: "Exibe notificação no cliente (toast).",
    category: "comunicação",
    availability: "live",
    connects: ["notifications"],
  },
  {
    id: "create-financial-entry",
    actionKey: "CREATE_FINANCIAL_ENTRY",
    label: "Atualizar Financeiro",
    description: "Cria lançamento financeiro a partir do evento.",
    category: "financeiro",
    availability: "live",
    connects: ["finance"],
  },
  {
    id: "pause-product",
    actionKey: "PAUSE_PRODUCT",
    label: "Pausar produto",
    description: "Pausa produto no catálogo.",
    category: "catálogo",
    availability: "live",
    connects: ["pdv", "inventory"],
  },
  {
    id: "activate-product",
    actionKey: "ACTIVATE_PRODUCT",
    label: "Ativar produto",
    description: "Ativa produto no catálogo.",
    category: "catálogo",
    availability: "live",
    connects: ["pdv"],
  },
  {
    id: "pause-option",
    actionKey: "PAUSE_OPTION",
    label: "Pausar opção",
    description: "Pausa opção de composição.",
    category: "catálogo",
    availability: "live",
    connects: ["pdv"],
  },
  {
    id: "activate-option",
    actionKey: "ACTIVATE_OPTION",
    label: "Ativar opção",
    description: "Ativa opção de composição.",
    category: "catálogo",
    availability: "live",
    connects: ["pdv"],
  },
  {
    id: "purchase-suggestion",
    actionKey: "CREATE_PURCHASE_SUGGESTION",
    label: "Sugerir compra",
    description: "Registra sugestão de compra (stub operacional).",
    category: "estoque",
    availability: "live",
    connects: ["inventory", "tasks"],
  },
  {
    id: "send-email",
    actionKey: "SEND_EMAIL",
    label: "Enviar e-mail",
    description: "Canal de e-mail (preparado / stub).",
    category: "comunicação",
    availability: "live",
    connects: ["notifications"],
  },
  {
    id: "send-whatsapp",
    actionKey: "SEND_WHATSAPP",
    label: "Enviar WhatsApp",
    description: "Canal WhatsApp (preparado / stub).",
    category: "comunicação",
    availability: "live",
    connects: ["notifications"],
  },
  {
    id: "update-business-brain",
    actionKey: "UPDATE_BUSINESS_BRAIN",
    label: "Atualizar Business Brain",
    description: "Recalcula insights e saúde no Business Brain.",
    category: "inteligência",
    availability: "planned",
    connects: ["business_brain", "ai"],
    example: "Após venda finalizada → refrescar cérebro operacional.",
  },
  {
    id: "update-dashboard",
    actionKey: "UPDATE_DASHBOARD",
    label: "Atualizar Dashboard",
    description: "Invalidar / refrescar indicadores do Command Center.",
    category: "inteligência",
    availability: "planned",
    connects: ["dashboard"],
  },
  {
    id: "update-inventory",
    actionKey: "UPDATE_INVENTORY",
    label: "Atualizar Estoque",
    description: "Sincronizar visão de estoque após movimento.",
    category: "estoque",
    availability: "planned",
    connects: ["inventory"],
  },
  {
    id: "update-growth-hub",
    actionKey: "UPDATE_GROWTH_HUB",
    label: "Atualizar Growth Hub",
    description: "Alimentar métricas e oportunidades de crescimento.",
    category: "crescimento",
    availability: "planned",
    connects: ["growth_hub"],
  },
  {
    id: "log-activity",
    actionKey: "LOG_ACTIVITY",
    label: "Registrar atividade",
    description: "Grava atividade no histórico operacional.",
    category: "sistema",
    availability: "planned",
    connects: ["system"],
  },
  {
    id: "create-task",
    actionKey: "CREATE_TASK",
    label: "Criar tarefa",
    description: "Abre tarefa operacional para o time.",
    category: "operações",
    availability: "planned",
    connects: ["tasks"],
  },
  {
    id: "update-indicator",
    actionKey: "UPDATE_INDICATOR",
    label: "Atualizar indicador",
    description: "Atualiza KPI / meta no painel.",
    category: "inteligência",
    availability: "planned",
    connects: ["dashboard", "business_brain"],
  },
  {
    id: "generate-insight",
    actionKey: "GENERATE_INSIGHT",
    label: "Gerar insight",
    description: "Solicita insight contextual à camada de IA.",
    category: "inteligência",
    availability: "planned",
    connects: ["ai", "business_brain"],
  },
  {
    id: "run-workflow",
    actionKey: "RUN_WORKFLOW",
    label: "Executar workflow",
    description: "Encadeia outro fluxo de automação.",
    category: "sistema",
    availability: "planned",
    connects: ["system"],
  },
  {
    id: "schedule-campaign",
    actionKey: "SCHEDULE_CAMPAIGN",
    label: "Agendar campanha",
    description: "Agenda campanha no Growth Hub.",
    category: "crescimento",
    availability: "planned",
    connects: ["growth_hub"],
  },
  {
    id: "prepare-ai",
    actionKey: "PREPARE_AI",
    label: "Preparar IA",
    description: "Pré-aquece contexto para Cosmo AI / Business Brain.",
    category: "inteligência",
    availability: "planned",
    connects: ["ai", "business_brain"],
  },
];

export function getLiveActions() {
  return ACTION_CATALOG.filter((item) => item.availability === "live");
}

export function getPlannedActions() {
  return ACTION_CATALOG.filter((item) => item.availability === "planned");
}

export function findActionByKey(actionKey: string) {
  return ACTION_CATALOG.find((item) => item.actionKey === actionKey);
}
