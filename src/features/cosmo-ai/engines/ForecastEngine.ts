import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoForecast } from "../types/cosmoAi";

export class ForecastEngine {
  generate(context: CosmoAiAnalysisContext): CosmoForecast[] {
    const forecasts: CosmoForecast[] = [];
    const now = new Date().toISOString();

    const hoursLeft = Math.max(24 - new Date().getHours(), 1);
    const projectedRevenue =
      context.dashboard.todaySales > 0
        ? (context.dashboard.todayRevenue / Math.max(new Date().getHours(), 1)) *
          hoursLeft +
          context.dashboard.todayRevenue
        : context.dashboard.averageTicket * 8;

    forecasts.push({
      id: "forecast-revenue-today",
      category: "finance",
      title: "Receita projetada hoje",
      description: `Com base no ritmo atual, a receita de hoje deve fechar próximo de ${projectedRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
      confidence: context.dashboard.todaySales >= 5 ? 78 : 52,
      valueLabel: projectedRevenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      predictedAt: now,
    });

    for (const product of context.operation.products.filter(
      (p) => p.status === "active" && p.stock > 0
    )) {
      const soldToday = context.saleItems
        .filter((i) => i.productId === product.id)
        .reduce((s, i) => s + i.quantity, 0);

      if (soldToday < 2) continue;

      const hoursElapsed = Math.max(new Date().getHours(), 1);
      const dailyProjection = Math.round((soldToday / hoursElapsed) * 24);

      if (dailyProjection > product.stock) {
        const depletionHour = Math.round(
          (product.stock / soldToday) * hoursElapsed
        );
        forecasts.push({
          id: `forecast-stock-${product.id}`,
          category: "stock",
          title: product.name,
          description: `Projeção de ${dailyProjection} un. vendidas hoje. Estoque esgota por volta das ${depletionHour}h.`,
          confidence: soldToday >= 4 ? 74 : 58,
          predictedAt: now,
        });
      }
    }

    if (context.realtime.kitchenQueueSize > 0) {
      const waitMinutes =
        context.realtime.averagePrepMinutes +
        context.realtime.kitchenQueueSize * 4;
      forecasts.push({
        id: "forecast-kitchen-wait",
        category: "operation",
        title: "Tempo de fila",
        description: `Novos pedidos devem aguardar ~${Math.round(waitMinutes)} min na cozinha.`,
        confidence: context.realtime.kitchenQueueSize >= 3 ? 70 : 50,
        valueLabel: `${Math.round(waitMinutes)} min`,
        predictedAt: now,
      });
    }

    return forecasts.slice(0, 8);
  }
}

export const forecastEngine = new ForecastEngine();
