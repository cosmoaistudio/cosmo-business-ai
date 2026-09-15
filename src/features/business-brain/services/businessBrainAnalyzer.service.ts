import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import type { DashboardStats } from "@/features/dashboard/types/dashboard";
import type { CosmoAiPanelData } from "@/features/cosmo-ai/types/cosmoAi";

import type {
  BrainAlert,
  BrainGoal,
  BrainOpportunity,
  BusinessBrainSnapshot,
  DomainHealth,
  HealthLevel,
  InsightComparison,
  MarketingInsight,
  SmartSummaryItem,
} from "../types/businessBrain.types";

function levelFromScore(score: number): HealthLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "attention";
  return "critical";
}

function levelLabel(level: HealthLevel) {
  switch (level) {
    case "excellent":
      return "Excelente";
    case "good":
      return "Bom";
    case "attention":
      return "Atenção";
    case "critical":
      return "Crítico";
  }
}

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreOperation(stats: DashboardStats) {
  const salesFactor = Math.min(40, stats.todaySales * 4);
  const goalFactor = Math.min(40, stats.dailyGoal.progressPercent * 0.4);
  const productFactor = stats.activeProducts > 0 ? 20 : 5;
  return clamp(salesFactor + goalFactor + productFactor);
}

function scoreFinance(stats: DashboardStats) {
  const profit = stats.finance.profitToday;
  const revenue = stats.todayRevenue;
  if (revenue <= 0 && profit <= 0) return 45;
  if (profit < 0) return 30;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return clamp(55 + margin);
}

function scoreOrders(stats: DashboardStats) {
  const base = Math.min(70, stats.todaySales * 6);
  const ticket = stats.ticketComparison.changePercent;
  const ticketBoost = ticket >= 0 ? 20 : Math.max(-15, ticket);
  return clamp(base + ticketBoost + 10);
}

function scoreStock(stats: DashboardStats) {
  if (stats.outOfStockCount > 0) return clamp(35 - stats.outOfStockCount * 5);
  if (stats.lowStockCount > 3) return 55;
  if (stats.lowStockCount > 0) return 70;
  return 92;
}

function scoreCustomers(stats: DashboardStats) {
  const active = Math.min(50, stats.activeCustomers);
  const recurring = Math.min(30, stats.recurringCustomers * 2);
  const neu = stats.newCustomersToday > 0 ? 20 : 8;
  return clamp(active + recurring + neu);
}

function scoreMarketing(stats: DashboardStats) {
  // Proxy until Growth Hub is connected to persistence
  const engagementProxy = stats.todaySales > 0 ? 72 : 48;
  const contentProxy = stats.topSellingProducts.length > 0 ? 12 : 0;
  return clamp(engagementProxy + contentProxy);
}

function scoreAi(ai: CosmoAiPanelData | null) {
  if (!ai) return 55;
  return clamp(ai.healthIndex);
}

function buildDomains(
  stats: DashboardStats,
  ai: CosmoAiPanelData | null
): DomainHealth[] {
  const items: Array<Omit<DomainHealth, "level"> & { score: number }> = [
    {
      id: "operation",
      label: "Operação",
      score: scoreOperation(stats),
      summary: `${formatNumber(stats.todaySales)} pedidos hoje`,
    },
    {
      id: "finance",
      label: "Financeiro",
      score: scoreFinance(stats),
      summary: `Lucro do dia ${formatCurrency(stats.finance.profitToday)}`,
    },
    {
      id: "orders",
      label: "Pedidos",
      score: scoreOrders(stats),
      summary: `Ticket médio ${formatCurrency(stats.todayAverageTicket)}`,
    },
    {
      id: "stock",
      label: "Estoque",
      score: scoreStock(stats),
      summary:
        stats.lowStockCount > 0
          ? `${stats.lowStockCount} itens em atenção`
          : "Níveis estáveis",
    },
    {
      id: "customers",
      label: "Clientes",
      score: scoreCustomers(stats),
      summary: `${formatNumber(stats.activeCustomers)} ativos`,
    },
    {
      id: "marketing",
      label: "Marketing",
      score: scoreMarketing(stats),
      summary: "Sinais de crescimento prontos no Growth Hub",
    },
    {
      id: "ai",
      label: "IA",
      score: scoreAi(ai),
      summary: ai
        ? `${ai.priorities.length} prioridade(s) ativas`
        : "Aguardando análise",
    },
  ];

  return items.map((item) => ({
    ...item,
    level: levelFromScore(item.score),
  }));
}

function buildSummary(
  stats: DashboardStats,
  ai: CosmoAiPanelData | null
): SmartSummaryItem[] {
  const revenueDelta = stats.comparisons.revenueTodayVsYesterday;
  const ticketDelta = stats.ticketComparison;
  const top = stats.topSellingProducts[0];
  const criticalStock = stats.stockAlerts[0];

  const items: SmartSummaryItem[] = [
    {
      id: "sum-revenue",
      text:
        revenueDelta.changePercent === 0
          ? "Receita de hoje está em linha com ontem."
          : `Hoje você vendeu ${formatPercent(revenueDelta.changePercent)} ${
              revenueDelta.trend === "up" ? "a mais" : "a menos"
            } que ontem.`,
      tone:
        revenueDelta.trend === "up"
          ? "positive"
          : revenueDelta.trend === "down"
            ? "warning"
            : "neutral",
    },
    {
      id: "sum-ticket",
      text: `O ticket ${
        ticketDelta.changePercent >= 0 ? "subiu" : "caiu"
      } ${formatPercent(Math.abs(ticketDelta.changePercent))}.`,
      tone: ticketDelta.changePercent >= 0 ? "positive" : "warning",
    },
  ];

  if (criticalStock) {
    items.push({
      id: "sum-stock",
      text: `O estoque de ${criticalStock.productName} exige atenção (${criticalStock.currentStock} un.).`,
      tone: criticalStock.severity === "critical" ? "critical" : "warning",
    });
  }

  if (top) {
    const share =
      stats.todayRevenue > 0
        ? Math.round((top.totalRevenue / Math.max(stats.todayRevenue, 1)) * 100)
        : Math.round(
            (top.totalQuantity / Math.max(stats.todaySales, 1)) * 100
          );
    items.push({
      id: "sum-top",
      text: `${top.productName} está entre os destaques (${share || top.totalQuantity}% do sinal de vendas).`,
      tone: "neutral",
    });
  }

  if (ai?.priorities[0]) {
    items.push({
      id: "sum-ai",
      text: ai.priorities[0].message,
      tone: "warning",
    });
  }

  return items.slice(0, 5);
}

function buildOpportunities(stats: DashboardStats): BrainOpportunity[] {
  const list: BrainOpportunity[] = [];

  if (stats.lowStockCount > 0 || stats.outOfStockCount > 0) {
    list.push({
      id: "opp-restock",
      kind: "restock",
      title: "Repor estoque",
      description: `${stats.lowStockCount + stats.outOfStockCount} produto(s) pedem reposição.`,
      priority: "high",
    });
  }

  if (stats.ticketComparison.trend === "down") {
    list.push({
      id: "opp-promo",
      kind: "promotion",
      title: "Criar promoção",
      description: "Ticket em queda — um combo pode recuperar margem e volume.",
      priority: "medium",
    });
  }

  if (stats.todaySales > 0) {
    list.push({
      id: "opp-content",
      kind: "content",
      title: "Publicar conteúdo",
      description: "Transforme o produto mais vendido em post no Growth Hub.",
      priority: "medium",
    });
  }

  list.push({
    id: "opp-budget",
    kind: "budget",
    title: "Aumentar orçamento",
    description: "Prepare tráfego pago quando o produto âncora estiver estável.",
    priority: "low",
  });

  if (stats.activeCustomers > 0 && stats.newCustomersToday === 0) {
    list.push({
      id: "opp-reactivate",
      kind: "reactivate",
      title: "Retomar clientes",
      description: "Sem novos clientes hoje — reative a base recorrente.",
      priority: "medium",
    });
  }

  return list.slice(0, 5);
}

function buildAlerts(
  stats: DashboardStats,
  ai: CosmoAiPanelData | null
): BrainAlert[] {
  const alerts: BrainAlert[] = [];

  if (stats.outOfStockCount > 0) {
    alerts.push({
      id: "al-oos",
      title: "Produtos sem estoque",
      description: `${stats.outOfStockCount} item(ns) zerados.`,
      severity: "critical",
      category: "stock",
    });
  }

  if (stats.finance.profitToday < 0) {
    alerts.push({
      id: "al-profit",
      title: "Lucro negativo",
      description: "O resultado do dia está abaixo de zero.",
      severity: "critical",
      category: "finance",
    });
  }

  const margin =
    stats.todayRevenue > 0
      ? (stats.finance.profitToday / stats.todayRevenue) * 100
      : 0;
  if (stats.todayRevenue > 0 && margin > 0 && margin < 12) {
    alerts.push({
      id: "al-margin",
      title: "Baixa margem",
      description: `Margem do dia em ${margin.toFixed(1)}%.`,
      severity: "warning",
      category: "margin",
    });
  }

  if (stats.todaySales === 0) {
    alerts.push({
      id: "al-orders",
      title: "Pedidos em ritmo baixo",
      description: "Nenhuma venda concluída registrada hoje.",
      severity: "warning",
      category: "orders",
    });
  }

  if (stats.activeCustomers > 0 && stats.recurringCustomers === 0) {
    alerts.push({
      id: "al-inactive",
      title: "Clientes inativos",
      description: "Sem recorrência detectada no recorte atual.",
      severity: "info",
      category: "customers",
    });
  }

  for (const alert of ai?.alerts.slice(0, 2) ?? []) {
    alerts.push({
      id: `al-ai-${alert.id}`,
      title: alert.title,
      description: alert.message,
      severity: alert.type === "urgent" ? "critical" : "warning",
      category: "orders",
    });
  }

  return alerts.slice(0, 6);
}

function buildInsights(stats: DashboardStats): InsightComparison[] {
  const revenue = stats.comparisons.revenueTodayVsYesterday;
  const week = stats.comparisons.revenueWeekVsPreviousWeek;
  const month = stats.comparisons.revenueMonthVsPreviousMonth;

  return [
    {
      id: "ins-today",
      label: "Hoje vs Ontem",
      currentLabel: "Hoje",
      currentValue: formatCurrency(stats.todayRevenue),
      previousLabel: "Ontem",
      previousValue: formatCurrency(revenue.previous),
      changePercent: revenue.changePercent,
      trend: revenue.trend,
    },
    {
      id: "ins-week",
      label: "Semana",
      currentLabel: "Esta semana",
      currentValue: formatCurrency(stats.weekRevenue),
      previousLabel: "Anterior",
      previousValue: formatCurrency(week.previous),
      changePercent: week.changePercent,
      trend: week.trend,
    },
    {
      id: "ins-month",
      label: "Mês",
      currentLabel: "Este mês",
      currentValue: formatCurrency(stats.monthRevenue),
      previousLabel: "Anterior",
      previousValue: formatCurrency(month.previous),
      changePercent: month.changePercent,
      trend: month.trend,
    },
    {
      id: "ins-ticket",
      label: "Ticket",
      currentLabel: "Hoje",
      currentValue: formatCurrency(stats.todayAverageTicket),
      previousLabel: "Período",
      previousValue: formatCurrency(stats.ticketComparison.previous),
      changePercent: stats.ticketComparison.changePercent,
      trend: stats.ticketComparison.trend,
    },
  ];
}

function buildGoals(stats: DashboardStats): BrainGoal[] {
  const goal = stats.dailyGoal;
  const orderTarget = Math.max(20, Math.round(goal.target / Math.max(stats.todayAverageTicket || 1, 1)));
  const profitTarget = goal.target * 0.25;
  const ticketTarget = stats.averageTicket || stats.todayAverageTicket || 1;
  const conversionProxy = stats.todaySales > 0 ? Math.min(100, stats.todaySales * 5) : 0;

  return [
    {
      id: "goal-revenue",
      label: "Receita",
      current: formatCurrency(goal.current),
      target: formatCurrency(goal.target),
      progressPercent: clamp(goal.progressPercent),
      hint: "Meta diária de faturamento",
    },
    {
      id: "goal-orders",
      label: "Pedidos",
      current: formatNumber(stats.todaySales),
      target: formatNumber(orderTarget),
      progressPercent: clamp((stats.todaySales / orderTarget) * 100),
      hint: "Volume operacional do dia",
    },
    {
      id: "goal-profit",
      label: "Lucro",
      current: formatCurrency(stats.finance.profitToday),
      target: formatCurrency(profitTarget),
      progressPercent: clamp(
        profitTarget > 0 ? (stats.finance.profitToday / profitTarget) * 100 : 0
      ),
      hint: "Resultado estimado do dia",
    },
    {
      id: "goal-ticket",
      label: "Ticket",
      current: formatCurrency(stats.todayAverageTicket),
      target: formatCurrency(ticketTarget),
      progressPercent: clamp(
        ticketTarget > 0 ? (stats.todayAverageTicket / ticketTarget) * 100 : 0
      ),
      hint: "Ticket médio vs referência",
    },
    {
      id: "goal-conversion",
      label: "Conversão",
      current: `${conversionProxy.toFixed(0)}%`,
      target: "100%",
      progressPercent: clamp(conversionProxy),
      hint: "Proxy até checkout digital conectado",
    },
  ];
}

function buildMarketing(stats: DashboardStats): MarketingInsight[] {
  const top = stats.topSellingProducts[0];
  return [
    {
      id: "mkt-content",
      title: "Conteúdo recomendado",
      description: top
        ? `Publique um Reels destacando ${top.productName}.`
        : "Publique bastidores da operação no Growth Hub.",
      network: "Instagram",
      bestTime: "11:30–13:00",
    },
    {
      id: "mkt-campaign",
      title: "Campanha sugerida",
      description: "Campanha de remarketing para clientes recorrentes.",
      network: "WhatsApp",
      bestTime: "18:00–20:00",
    },
    {
      id: "mkt-time",
      title: "Melhor horário",
      description: "Janela de maior movimento com base nas vendas do dia.",
      bestTime: stats.todaySales > 10 ? "12:00 e 19:00" : "Almoço e jantar",
    },
  ];
}

export function analyzeBusinessBrain(
  stats: DashboardStats,
  ai: CosmoAiPanelData | null
): BusinessBrainSnapshot {
  const domains = buildDomains(stats, ai);
  const overallScore = clamp(
    domains.reduce((sum, domain) => sum + domain.score, 0) / domains.length
  );

  return {
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallLevel: levelFromScore(overallScore),
    domains,
    summary: buildSummary(stats, ai),
    opportunities: buildOpportunities(stats),
    alerts: buildAlerts(stats, ai),
    insights: buildInsights(stats),
    goals: buildGoals(stats),
    marketing: buildMarketing(stats),
    suggestedQuestions: [
      "Como aumentar minhas vendas?",
      "Qual meu melhor produto?",
      "Quanto vou faturar hoje?",
      "O que está prejudicando minha margem?",
    ],
  };
}

export { levelLabel };
