import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoAnomaly } from "../types/cosmoAi";

export class AnomalyEngine {
  detect(context: CosmoAiAnalysisContext): CosmoAnomaly[] {
    const anomalies: CosmoAnomaly[] = [];
    const now = new Date().toISOString();

    const { comparisons, todaySales, averageTicket } = context.dashboard;

    if (
      comparisons.revenueTodayVsYesterday.previous > 0 &&
      Math.abs(comparisons.revenueTodayVsYesterday.changePercent) >= 30
    ) {
      anomalies.push({
        id: "anomaly-revenue-daily",
        category: "finance",
        title: "Variação atípica de receita",
        description: `Receita hoje ${comparisons.revenueTodayVsYesterday.changePercent > 0 ? "acima" : "abaixo"} do padrão diário.`,
        deviationPercent: Math.abs(
          comparisons.revenueTodayVsYesterday.changePercent
        ),
        severity:
          Math.abs(comparisons.revenueTodayVsYesterday.changePercent) >= 50
            ? "high"
            : "medium",
        detectedAt: now,
      });
    }

    if (todaySales >= 5 && averageTicket > 0) {
      const expectedTicket = context.dashboard.totalRevenue / Math.max(context.dashboard.totalSales, 1);
      const deviation =
        ((averageTicket - expectedTicket) / expectedTicket) * 100;

      if (Math.abs(deviation) >= 25) {
        anomalies.push({
          id: "anomaly-ticket",
          category: "finance",
          title: "Ticket médio atípico",
          description: `Ticket médio hoje ${deviation > 0 ? "acima" : "abaixo"} da média histórica.`,
          deviationPercent: Math.abs(Math.round(deviation)),
          severity: Math.abs(deviation) >= 40 ? "high" : "medium",
          detectedAt: now,
        });
      }
    }

    if (context.realtime.averagePrepMinutes > 25) {
      anomalies.push({
        id: "anomaly-prep-time",
        category: "operation",
        title: "Tempo de preparo elevado",
        description: `Média de ${Math.round(context.realtime.averagePrepMinutes)} min — acima do baseline operacional.`,
        deviationPercent: Math.round(
          ((context.realtime.averagePrepMinutes - 15) / 15) * 100
        ),
        severity: context.realtime.averagePrepMinutes >= 35 ? "high" : "medium",
        detectedAt: now,
      });
    }

    const criticalStock = context.operation.stockAlerts.filter(
      (a) => a.currentStock === 0
    ).length;
    if (criticalStock >= 3) {
      anomalies.push({
        id: "anomaly-stock-cluster",
        category: "stock",
        title: "Cluster de ruptura",
        description: `${criticalStock} produtos com estoque zerado simultaneamente.`,
        deviationPercent: criticalStock * 15,
        severity: "high",
        detectedAt: now,
      });
    }

    return anomalies;
  }
}

export const anomalyEngine = new AnomalyEngine();
