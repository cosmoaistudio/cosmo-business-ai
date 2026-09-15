import type { OperationSetupStatus } from "@/features/operation-onboarding";
import type { DashboardStats } from "../types/dashboard";

export type AttentionPriority = "high" | "medium" | "low";

export type AttentionAlertId =
  | "no_products"
  | "products_inactive"
  | "digital_unpublished"
  | "no_sales_today";

export interface AttentionAlert {
  id: AttentionAlertId;
  priority: AttentionPriority;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface BuildDashboardAttentionAlertsInput {
  stats: Pick<
    DashboardStats,
    "totalProducts" | "activeProducts" | "todaySales"
  >;
  /** True while dashboard metrics are still loading */
  statsLoading: boolean;
  /** True when metrics failed — never invent product/sales alerts from zeros */
  statsError: boolean;
  operationStatus: OperationSetupStatus | null;
  /** True while operation setup signals are loading */
  operationLoading: boolean;
  maxAlerts?: number;
}

const PRIORITY_RANK: Record<AttentionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const MAX_ALERTS_DEFAULT = 3;

function stepCompleted(
  status: OperationSetupStatus | null,
  stepId: OperationSetupStatus["steps"][number]["id"]
): boolean {
  return status?.steps.some((step) => step.id === stepId && step.completed) === true;
}

/**
 * Avoid echoing the OperationSetupGuide "next step".
 * Setup guide owns the current configuration focus; attention covers
 * other real situations (or the same topic only when it is not the next step).
 */
function isCoveredBySetupNextStep(
  status: OperationSetupStatus | null,
  alertId: AttentionAlertId
): boolean {
  if (!status || status.allComplete) return false;
  const nextId = status.nextStep?.id;
  if (!nextId) return false;

  if (
    (alertId === "no_products" || alertId === "products_inactive") &&
    nextId === "first_product"
  ) {
    return true;
  }

  if (alertId === "digital_unpublished" && nextId === "digital_order") {
    return true;
  }

  if (alertId === "no_sales_today" && nextId === "first_sale") {
    return true;
  }

  return false;
}

/**
 * Pure builder: only real conditions from DashboardStats + OperationSetupStatus.
 * No network calls. Cancelled sales never appear in todaySales (repository filters completed).
 */
export function buildDashboardAttentionAlerts(
  input: BuildDashboardAttentionAlertsInput
): AttentionAlert[] {
  const maxAlerts = input.maxAlerts ?? MAX_ALERTS_DEFAULT;

  if (input.statsLoading || input.operationLoading) {
    return [];
  }

  const candidates: AttentionAlert[] = [];

  // —— Products (from dashboard metrics; mutually exclusive) ——
  if (!input.statsError) {
    if (input.stats.totalProducts === 0) {
      candidates.push({
        id: "no_products",
        priority: "high",
        title: "Você ainda não tem produtos disponíveis",
        description:
          "Cadastre e ative seu primeiro produto para começar a vender.",
        ctaLabel: "Criar produto",
        href: "/produtos",
      });
    } else if (input.stats.activeProducts === 0) {
      candidates.push({
        id: "products_inactive",
        priority: "high",
        title: "Seus produtos estão desativados",
        description:
          "Existem produtos cadastrados, mas nenhum está disponível para venda.",
        ctaLabel: "Ver produtos",
        href: "/produtos",
      });
    }
  }

  // —— Digital order (from operation setup step signal) ——
  // Only when first product is ready: proves load succeeded with real progress
  // and the store is far enough to care about publishing.
  if (
    input.operationStatus &&
    stepCompleted(input.operationStatus, "first_product") &&
    !stepCompleted(input.operationStatus, "digital_order")
  ) {
    candidates.push({
      id: "digital_unpublished",
      priority: "medium",
      title: "Seu pedido digital ainda não está disponível",
      description:
        "Configure e publique seu cardápio para receber pedidos online.",
      ctaLabel: "Configurar pedido digital",
      href: "/configuracoes/pedido-digital",
    });
  }

  // —— No sales today (contextual, not an error) ——
  if (
    !input.statsError &&
    input.stats.activeProducts > 0 &&
    input.stats.todaySales === 0
  ) {
    // If first sale never happened, OperationSetupGuide owns that step.
    if (stepCompleted(input.operationStatus, "first_sale")) {
      candidates.push({
        id: "no_sales_today",
        priority: "low",
        title: "Seu dia ainda não teve vendas",
        description: "Registre sua primeira venda de hoje no PDV.",
        ctaLabel: "Ir para o PDV",
        href: "/pdv",
      });
    }
  }

  return candidates
    .filter((alert) => !isCoveredBySetupNextStep(input.operationStatus, alert.id))
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (byPriority !== 0) return byPriority;
      return a.id.localeCompare(b.id);
    })
    .slice(0, maxAlerts);
}
