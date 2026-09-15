import type { ILLMProvider } from "../interfaces/llm";
import type { CosmoAiAnalysisContext } from "../types/analysisContext";
import type { CosmoAiPanelData } from "../types/cosmoAi";
import { insightEngine } from "./InsightEngine";
import { recommendationEngine } from "./RecommendationEngine";
import { forecastEngine } from "./ForecastEngine";
import { anomalyEngine } from "./AnomalyEngine";
import { cosmoNotificationEngine } from "./NotificationEngine";
import { taskEngine } from "./TaskEngine";
import { buildAiTimeline } from "../utils/aiTimeline";
import { StubLLMProvider } from "../providers/StubLLMProvider";
import { StubWeatherProvider } from "../providers/StubWeatherProvider";

export class AIEngine {
  private llmProvider: ILLMProvider | null = null;
  private weatherProvider = new StubWeatherProvider();

  setLLMProvider(provider: ILLMProvider | null) {
    this.llmProvider = provider;
  }

  getLLMProvider(): ILLMProvider {
    return this.llmProvider ?? new StubLLMProvider();
  }

  async analyze(context: CosmoAiAnalysisContext): Promise<CosmoAiPanelData> {
    const weather = await this.weatherProvider.getTodayForecast();

    let insights = insightEngine.generate(context, weather);

    const llm = this.getLLMProvider();
    if (await llm.isAvailable()) {
      try {
        const llmInsights = await llm.generateInsights(context);
        const existingIds = new Set(insights.map((i) => i.id));
        for (const extra of llmInsights) {
          if (!existingIds.has(extra.id)) insights.push(extra);
        }
        insights = insightEngine.generate(context, weather);
      } catch (error) {
        console.warn("LLM insights unavailable, using rule-based:", error);
      }
    }

    const activeInsights = insightEngine.getActive(insights);
    const alerts = insightEngine.getAlerts(insights);
    const priorities = insightEngine.getPriorities(insights);

    let recommendations = recommendationEngine.generate(insights);

    if (await llm.isAvailable()) {
      try {
        const llmRecs = await llm.generateRecommendations(context, activeInsights);
        if (llmRecs.length > 0) {
          recommendations = [...recommendations, ...llmRecs].slice(0, 12);
        }
      } catch {
        // keep rule-based
      }
    }

    const forecasts = forecastEngine.generate(context);
    const anomalies = anomalyEngine.detect(context);
    const tasks = taskEngine.generateFromInsights(activeInsights);
    const timeline = buildAiTimeline(insights);

    await cosmoNotificationEngine.notifyUrgent(alerts);

    const healthIndex = Math.round(
      priorities.length > 0
        ? Math.max(
            0,
            100 -
              priorities.filter((p) => p.type === "urgent").length * 12 -
              alerts.length * 5
          )
        : 85
    );

    return {
      priorities,
      insights: activeInsights,
      alerts,
      recommendations,
      forecasts,
      anomalies,
      tasks,
      timeline,
      lastAnalysisAt: context.analyzedAt,
      healthIndex,
    };
  }
}

export const aiEngine = new AIEngine();
