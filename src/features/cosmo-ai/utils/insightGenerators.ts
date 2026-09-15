import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoInsight } from "../types/cosmoAi";
import { computeInsightScore } from "./insightScoring";

const DAY_NAMES = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function formatTimeRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} e ${fmt(end)}`;
}

function hoursSinceMidnight() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

export function generateStockInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();

  for (const product of ctx.operation.products) {
    if (product.stock <= 0 || product.status !== "active") continue;

    const soldToday = ctx.saleItems
      .filter((item) => item.productId === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (soldToday <= 0) continue;

    const hoursElapsed = Math.max(hoursSinceMidnight(), 1);
    const velocity = soldToday / hoursElapsed;
    if (velocity <= 0) continue;

    const hoursUntilDepletion = product.stock / velocity;
    const depletionTime = new Date(Date.now() + hoursUntilDepletion * 3600_000);
    const windowStart = new Date(depletionTime.getTime() - 20 * 60_000);
    const windowEnd = new Date(depletionTime.getTime() + 20 * 60_000);

    if (hoursUntilDepletion > 14) continue;

    insights.push({
      id: `stock-depletion-${product.id}`,
      category: "stock",
      type: hoursUntilDepletion <= 3 ? "urgent" : "alert",
      source: "stock",
      title: product.name,
      message: `O ${product.name} acabará hoje entre ${formatTimeRange(windowStart, windowEnd)}.`,
      score: computeInsightScore({
        category: "stock",
        type: hoursUntilDepletion <= 3 ? "urgent" : "alert",
        confidence: soldToday >= 3 ? 82 : 65,
        urgencyOverride: Math.min(95, 50 + (soldToday / product.stock) * 40),
      }),
      status: "active",
      actionLabel: "Repor estoque",
      href: "/estoque",
      entityId: product.id,
      entityType: "product",
      metadata: { soldToday, currentStock: product.stock, hoursUntilDepletion },
      createdAt: now,
    });
  }

  for (const alert of ctx.operation.stockAlerts.filter((a) => a.severity === "warning")) {
    insights.push({
      id: `stock-low-${alert.productId}`,
      category: "stock",
      type: "alert",
      source: "stock",
      title: alert.productName,
      message: `Estoque baixo: ${alert.currentStock} un. (mínimo ${alert.minStock}).`,
      score: computeInsightScore({
        category: "stock",
        type: "alert",
        confidence: 90,
      }),
      status: "active",
      actionLabel: "Ver estoque",
      href: "/estoque",
      entityId: alert.productId,
      entityType: "product",
      createdAt: now,
    });
  }

  return insights;
}

export function generateProductInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();
  const todayDow = new Date().getDay();

  const byProductDay = new Map<string, Map<number, number>>();

  for (const item of ctx.saleItems) {
    const dow = new Date(item.createdAt).getDay();
    const productDays = byProductDay.get(item.productId) ?? new Map<number, number>();
    productDays.set(dow, (productDays.get(dow) ?? 0) + item.quantity);
    byProductDay.set(item.productId, productDays);
  }

  for (const [productId, dayMap] of byProductDay) {
    const todayQty = dayMap.get(todayDow) ?? 0;
    const otherDays = [...dayMap.entries()].filter(([d]) => d !== todayDow);
    if (otherDays.length === 0 || todayQty < 2) continue;

    const avgOther =
      otherDays.reduce((sum, [, qty]) => sum + qty, 0) / otherDays.length;
    if (avgOther <= 0) continue;

    const increasePercent = Math.round(((todayQty - avgOther) / avgOther) * 100);
    if (increasePercent < 25) continue;

    const productName =
      ctx.saleItems.find((i) => i.productId === productId)?.productName ??
      ctx.operation.products.find((p) => p.id === productId)?.name ??
      "Produto";

    const bestDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const bestDayName = DAY_NAMES[bestDay[0]];
    const totalAll = [...dayMap.values()].reduce((s, v) => s + v, 0);
    const bestDayShare = Math.round((bestDay[1] / totalAll) * 100);

    if (bestDayShare >= 30) {
      insights.push({
        id: `product-pattern-${productId}-${bestDay[0]}`,
        category: "products",
        type: "information",
        source: "sales",
        title: productName,
        message: `O ${productName} vende ${bestDayShare}% mais aos ${bestDayName}s.`,
        score: computeInsightScore({
          category: "products",
          type: "information",
          confidence: totalAll >= 10 ? 78 : 58,
        }),
        status: "active",
        actionLabel: "Ver produto",
        href: `/produtos/builder/${productId}`,
        entityId: productId,
        entityType: "product",
        metadata: { bestDayShare, bestDayName },
        createdAt: now,
      });
    }
  }

  const topProducts = ctx.dashboard.topSellingProducts.slice(0, 3);
  for (const product of topProducts) {
    const recentItems = ctx.saleItems.filter((i) => i.productId === product.productId);
    const last7 = recentItems.filter(
      (i) => Date.now() - new Date(i.createdAt).getTime() <= 7 * 86400_000
    );
    const prev7 = recentItems.filter((i) => {
      const age = Date.now() - new Date(i.createdAt).getTime();
      return age > 7 * 86400_000 && age <= 14 * 86400_000;
    });

    const recentRev = last7.reduce((s, i) => s + Number(i.subtotal), 0);
    const prevRev = prev7.reduce((s, i) => s + Number(i.subtotal), 0);

    if (prevRev > 0 && recentRev > 0) {
      const change = Math.round(((recentRev - prevRev) / prevRev) * 100);
      if (change <= -5) {
        insights.push({
          id: `product-margin-${product.productId}`,
          category: "finance",
          type: "alert",
          source: "finance",
          title: product.productName,
          message: `A margem do produto ${product.productName} caiu ${Math.abs(change)}%.`,
          score: computeInsightScore({
            category: "finance",
            type: "alert",
            confidence: prev7.length >= 3 ? 72 : 55,
            impactOverride: 70,
          }),
          status: "active",
          actionLabel: "Analisar produto",
          href: `/produtos/builder/${product.productId}`,
          entityId: product.productId,
          entityType: "product",
          metadata: { changePercent: change },
          createdAt: now,
        });
      }
    }
  }

  return insights;
}

export function generateMarketingInsights(
  ctx: CosmoAiAnalysisContext,
  weather?: { condition: string; rainProbability: number }
): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();

  const rainProb = weather?.rainProbability ?? estimateRainProbability();
  const isRainy = rainProb >= 50;

  if (isRainy) {
    const shakeCandidate =
      ctx.operation.products.find(
        (p) =>
          p.status === "active" &&
          /shake|milk|vitamina|açaí|açai/i.test(p.name)
      ) ??
      ctx.dashboard.topSellingProducts.find((p) =>
        /shake|milk|vitamina|açaí|açai/i.test(p.productName)
      );

    const productName =
      "productName" in (shakeCandidate ?? {})
        ? (shakeCandidate as { productName: string }).productName
        : (shakeCandidate as { name?: string })?.name ?? "Milk Shake";

    insights.push({
      id: "marketing-rain-shake",
      category: "marketing",
      type: "suggestion",
      source: "system",
      title: "Oportunidade climática",
      message: `Hoje a previsão é de chuva. Recomendo destacar ${productName}.`,
      score: computeInsightScore({
        category: "marketing",
        type: "suggestion",
        confidence: rainProb >= 70 ? 75 : 60,
      }),
      status: "active",
      actionLabel: "Ver produtos",
      href: "/produtos",
      metadata: { rainProbability: rainProb, suggestedProduct: productName },
      createdAt: now,
    });
  }

  if (ctx.dashboard.comparisons.revenueTodayVsYesterday.trend === "down") {
    const drop = Math.abs(
      ctx.dashboard.comparisons.revenueTodayVsYesterday.changePercent
    );
    if (drop >= 10) {
      insights.push({
        id: "marketing-revenue-drop",
        category: "marketing",
        type: "opportunity",
        source: "sales",
        title: "Queda de receita",
        message: `Receita hoje ${drop.toFixed(0)}% abaixo de ontem. Considere promoção relâmpago.`,
        score: computeInsightScore({
          category: "marketing",
          type: "opportunity",
          confidence: 68,
        }),
        status: "active",
        actionLabel: "Ver dashboard",
        href: "/",
        createdAt: now,
      });
    }
  }

  return insights;
}

function estimateRainProbability(): number {
  const month = new Date().getMonth();
  if (month >= 10 || month <= 2) return 55;
  if (month >= 5 && month <= 8) return 25;
  return 40;
}

export function generateCustomerInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();
  const inactiveCount = ctx.operation.customersWithoutRecentActivity.length;

  if (inactiveCount > 0) {
    insights.push({
      id: "customers-inactive-30d",
      category: "customers",
      type: inactiveCount >= 50 ? "alert" : "information",
      source: "customers",
      title: "Clientes inativos",
      message: `${inactiveCount} clientes não compram há mais de 30 dias.`,
      score: computeInsightScore({
        category: "customers",
        type: inactiveCount >= 50 ? "alert" : "information",
        confidence: 88,
        urgencyOverride: Math.min(90, 30 + inactiveCount / 2),
      }),
      status: "active",
      actionLabel: "Ver clientes",
      href: "/clientes",
      metadata: { inactiveCount },
      createdAt: now,
    });
  }

  return insights;
}

export function generateDeliveryInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();

  const deliveryTickets = ctx.operation.kitchenTickets.filter(
    (t) => t.ticketType === "delivery" && t.completedAt && t.createdAt
  );

  if (deliveryTickets.length < 3) return insights;

  const recent = deliveryTickets.filter(
    (t) => Date.now() - new Date(t.createdAt).getTime() <= 3 * 86400_000
  );
  const previous = deliveryTickets.filter((t) => {
    const age = Date.now() - new Date(t.createdAt).getTime();
    return age > 3 * 86400_000 && age <= 7 * 86400_000;
  });

  function avgMinutes(tickets: typeof deliveryTickets) {
    const times = tickets
      .map((t) => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.completedAt!).getTime();
        return (end - start) / 60_000;
      })
      .filter((m) => m > 0 && m < 180);
    return times.length ? times.reduce((s, v) => s + v, 0) / times.length : 0;
  }

  const recentAvg = avgMinutes(recent);
  const prevAvg = avgMinutes(previous);

  if (recentAvg > 0 && prevAvg > 0) {
    const diff = Math.round(recentAvg - prevAvg);
    if (diff >= 5) {
      insights.push({
        id: "delivery-time-increase",
        category: "operation",
        type: "alert",
        source: "delivery",
        title: "Tempo de entrega",
        message: `O tempo médio aumentou ${diff} minutos.`,
        score: computeInsightScore({
          category: "operation",
          type: "alert",
          confidence: recent.length >= 5 ? 80 : 62,
          urgencyOverride: Math.min(90, 50 + diff * 2),
        }),
        status: "active",
        actionLabel: "Ver pedidos",
        href: "/pedidos",
        metadata: { diffMinutes: diff, recentAvg, prevAvg },
        createdAt: now,
      });
    }
  }

  return insights;
}

export function generateOperationInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();
  const { realtime } = ctx;

  const staleThresholdMs = 15 * 60_000;
  const staleOrders = ctx.operation.kitchenTickets.filter((t) => {
    if (t.status !== "pending" && t.status !== "accepted") return false;
    return Date.now() - new Date(t.createdAt).getTime() >= staleThresholdMs;
  });

  if (staleOrders.length > 0) {
    insights.push({
      id: "operation-stale-orders",
      category: "operation",
      type: "urgent",
      source: "kitchen",
      title: "Pedidos aguardando",
      message: `Existem ${staleOrders.length} pedidos aguardando há mais de 15 minutos.`,
      score: computeInsightScore({
        category: "operation",
        type: "urgent",
        confidence: 92,
        urgencyOverride: Math.min(98, 70 + staleOrders.length * 3),
      }),
      status: "active",
      actionLabel: "Abrir cozinha",
      href: "/cozinha",
      metadata: { staleCount: staleOrders.length },
      createdAt: now,
    });
  }

  if (realtime.ordersOverdue > 0) {
    insights.push({
      id: "operation-overdue",
      category: "operation",
      type: "urgent",
      source: "orders",
      title: "Pedidos atrasados",
      message: `${realtime.ordersOverdue} pedido(s) acima do SLA operacional.`,
      score: computeInsightScore({
        category: "operation",
        type: "urgent",
        confidence: 90,
      }),
      status: "active",
      actionLabel: "Centro de operações",
      href: "/operacoes",
      createdAt: now,
    });
  }

  if (
    ctx.connectivity.desktopTotal > 0 &&
    ctx.connectivity.desktopOnline === 0
  ) {
    insights.push({
      id: "operation-desktop-offline",
      category: "operation",
      type: "urgent",
      source: "desktop",
      title: "Desktop offline",
      message: "Nenhum agente desktop conectado à operação.",
      score: computeInsightScore({
        category: "operation",
        type: "urgent",
        confidence: 95,
      }),
      status: "active",
      actionLabel: "Configurações",
      href: "/configuracoes",
      createdAt: now,
    });
  }

  const failures = ctx.operation.automationLogs.filter(
    (l) => l.status === "failed"
  ).length;
  if (failures >= 2) {
    insights.push({
      id: "operation-automation-failures",
      category: "team",
      type: "alert",
      source: "automation",
      title: "Automações com falha",
      message: `${failures} automação(ões) falharam recentemente.`,
      score: computeInsightScore({
        category: "team",
        type: "alert",
        confidence: 85,
      }),
      status: "active",
      actionLabel: "Ver automações",
      href: "/automacoes",
      createdAt: now,
    });
  }

  return insights;
}

export function generateFinanceInsights(ctx: CosmoAiAnalysisContext): CosmoInsight[] {
  const insights: CosmoInsight[] = [];
  const now = new Date().toISOString();
  const { finance, comparisons } = ctx.dashboard;

  if (finance.profitToday < 0) {
    insights.push({
      id: "finance-negative-today",
      category: "finance",
      type: "alert",
      source: "finance",
      title: "Resultado negativo hoje",
      message: `Despesas superam receitas hoje. Prejuízo parcial detectado.`,
      score: computeInsightScore({
        category: "finance",
        type: "alert",
        confidence: 88,
      }),
      status: "active",
      actionLabel: "Ver financeiro",
      href: "/financeiro",
      createdAt: now,
    });
  }

  if (comparisons.revenueWeekVsPreviousWeek.trend === "up") {
    const pct = comparisons.revenueWeekVsPreviousWeek.changePercent;
    if (pct >= 15) {
      insights.push({
        id: "finance-week-growth",
        category: "finance",
        type: "information",
        source: "finance",
        title: "Crescimento semanal",
        message: `Receita da semana ${pct.toFixed(0)}% acima da semana anterior.`,
        score: computeInsightScore({
          category: "finance",
          type: "information",
          confidence: 75,
        }),
        status: "active",
        actionLabel: "Dashboard",
        href: "/",
        createdAt: now,
      });
    }
  }

  return insights;
}

export function generateAllRuleBasedInsights(
  ctx: CosmoAiAnalysisContext,
  weather?: { condition: string; rainProbability: number }
): CosmoInsight[] {
  return [
    ...generateOperationInsights(ctx),
    ...generateStockInsights(ctx),
    ...generateProductInsights(ctx),
    ...generateMarketingInsights(ctx, weather),
    ...generateCustomerInsights(ctx),
    ...generateDeliveryInsights(ctx),
    ...generateFinanceInsights(ctx),
  ];
}
